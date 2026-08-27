<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import { commonSearchApi, getCompanyList } from '@hiway/api/commonApi'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag.js'
import { useI18n } from 'vue-i18n'
import _ from 'lodash'
import Message from '@hiway/utils/notify'
import { isEmpty } from '@/@core/utils'

const emit = defineEmits(['selected'])
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const dialog = ref(false)
const grdMain = ref(null)
const disable = ref(false) // ILJOO_DUCHA 협력사가 조회일 경우 라디오 박스 직영 disable 처리
const strASGN_NM = ref('')
const strDEPT_CD = ref('')

const props = defineProps({
  //여러부서 선택시 체크바 활성화 props
  //2024.04.18김현재 추가
  checkBar: {
    type: Boolean,
    default: false,
  },
  autoDisabled: {
    type: Boolean,
    default: true,
  },
})

let hseLabel = 'HSESYS 적용조직'

let options = reactive({
  disabled: {
    CMPNY_DIV: true, // 회사구분
    ORGN_DIV: false, // 직영, 사내협력사
    BSNS_CD: false, // 사업부
    HSE_ONLY: false, // HSESY적용제외
    USE_OLNY: false, // 과거조직포함
    USE_TEAM: false,
  },
  values: { 
    CMPNY_DIV: userStore.cmpnyDiv,
    ORGN_DIV: '',
    BSNS_CD: '',
    ASGN_NM: '',
    DEPT_CD: '', //부서코드
    HSE_ONLY: 'Y',
    USE_ONLY: 'Y',
    USE_TEAM: '', //팀이름까지 조회하는 플래그값
  },
})

//코드리스트
const codeList = reactive({
  company: [],
  orgnDiv: [],
  bsnsCd: [],
  orgnDiv: [],
})

// 팝업 오픈 시 넘어오는 그리드 DataRow
// 작성자 : 이희원(2024-02-01)
const popParam = reactive({
  dataRow: '',
  fieldIndex: '',
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    getCompanyList(), // 회사구분
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: options.values.CMPNY_DIV, USE_DIV: 'Y' },
    }), // 사업부
  ]).then((res) => {
    codeList.company = res[0].ORESULT_CUR
    codeList.bsnsCd = res[1].ORESULT_CUR

    // ILJOO_DUCHA 협력사가 조회일 경우 라디오 박스 전체, 직영 disable 처리
    if (disable.value) {
      codeList.orgnDiv = [{ name: '사내협력사', code: 'B' }]
    } else {
      codeList.orgnDiv = [
        { name: '전체', code: '' },
        { name: '직영', code: 'A' },
        { name: '사내협력사', code: 'B' },
      ]
    }
    codeList.bsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    grdMain.value.setBindingColumn('CMPNY_DIV', codeList.company, 'COD', 'TXT') // 회사구분
    grdMain.value.setBindingColumn('BSNS_CD', codeList.bsnsCd, 'BSNS_CD', 'BSNS_NM') // 사업부
    grdMain.value.setBindingColumn('ORGN_DIV', codeList.orgnDiv, 'code', 'name') // 구분

    if (!userStore.company) {
      codeList.company = null
    }
  })
  //멀티체크시 '부문'컬럼 visible true 설정
  if (props.checkBar) {
    grdMainProps.field[3].visible = true
    grdMainProps.field = grdMainProps.columns
    grdMain.value.getGridView().setColumns(grdMainProps.columns)
  }
}

const grdMainProps = reactive({
  gridViewOption: {
    edit: { editable: false },
    stateBar: { visible: false },
    checkBar: { visible: props.checkBar },
  },
  field: [
    {
      fieldName: 'CMPNY_DIV',
      dataType: 'text',
      width: '150',
      styleName: 'left-column',
      lookupDisplay: true,
      header: { text: t('회사') },
    },
    {
      fieldName: 'ASGN_FULL_NM',
      dataType: 'text',
      width: '450',
      visible: true,
      styleName: 'left-column',
      header: { text: t('전체소속명') },
    },
    {
      fieldName: 'BSNS_NM',
      dataType: 'text',
      width: '150',
      styleName: 'left-column',
      header: { text: t('사업부') },
    },

    {
      fieldName: 'ASGN_SHRT_NM',
      dataType: 'text',
      width: '200',
      styleName: 'left-column',
      header: { text: t('소속명/협력사명') },
    },
    {
      fieldName: 'ORGN_DIV',
      dataType: 'text',
      styleName: 'left-column',
      lookupDisplay: true,
      header: { text: t('구분') },
    },
    {
      fieldName: 'ASGN_CD',
      dataType: 'text',
      width: '120',
      header: { text: t('소속코드') },
    },
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      width: '150',
      styleName: 'left-column',
      lookupDisplay: true,
      header: { text: t('사업부') },
      visible: false,
    },
    {
      fieldName: 'PART_NM',
      dataType: 'text',
      width: '150',
      visible: false,
      header: { text: t('부문') },
    },
    { fieldName: 'PART_CD', dataType: 'text', visible: false },

    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },

    // ILJOO_DUCHA 소속명칭 표시
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.field

const openPopup = async (popupParam) => {
  // ILJOO_DUCHA 협력사가 조회일 경우 라디오 박스 직영 disable 처리
  if (!isEmpty(popupParam)) {
    disable.value = popupParam.DISABLE

    // 2024-07-09 이상걸 수정(협력사명, 부서명 자동 입력)
    options.values.ASGN_NM = popupParam.ASGN_NM

    options.disabled.CMPNY_DIV = popupParam.CMP_DISABLE
  }

  initCodeList()

  /**************** popupParam Object로 넘겨주기 *****************/
  if (!popupParam) {
    dialog.value = true
    strASGN_NM.value = '소속명'
    strDEPT_CD.value = '소속코드'

    return
  }

  // ILJOO_DUCHA 협력사가 조회일 경우 아래 popupParam 처리 무시
  if (disable.value) {
    dialog.value = true
    options.values.ORGN_DIV = 'B'
    grdMain.value.getGridView().clearColumnFilters('ASGN_CD') // 필터해제

    // ILJOO_DUCHA 협력사가 조회일 경우 라벨 및 헤더 명 변경
    strASGN_NM.value = '협력사명'
    strDEPT_CD.value = '협력사코드'

    let header1 = grdMain.value.getGridView().getColumnProperty('ASGN_SHRT_NM', 'header')
    let header2 = grdMain.value.getGridView().getColumnProperty('ASGN_CD', 'header')

    header1.text = '협력사명'
    header2.text = '협력사코드'

    grdMain.value.getGridView().setColumnProperty('ASGN_SHRT_NM', 'header', header1)
    grdMain.value.getGridView().setColumnProperty('ASGN_CD', 'header', header2)

    onButtonsClick({ id: 'btnSearch' })

    return
  } else {
    strASGN_NM.value = '소속명 / 협력사'
    strDEPT_CD.value = '소속코드 / 협력사 코드'
  }

  if (popupParam.pageGbn === 'MNG') {
    hseLabel = 'HSE 경영시스템'
  }

  //팝업 오픈시HSESYS적용조직을 비활성화 시킴
  if (popupParam.HSE_SYS === 'N') {
    options.values.HSE_ONLY = 'N'
  } else {
    options.values.HSE_ONLY = 'Y'
  }

  for (const [key, value] of Object.entries(popupParam)) {
    options.values[key] = value
    if (options.disabled.hasOwnProperty(key) && props.autoDisabled) {
      options.disabled[key] = true
    }
  }

  commonSearchApi({
    queryId: 'searchDept',
    param: options.values,
  }).then((res) => {
    afterSearch(res)
    // 2024-06-25 정성연 수정(체크데이터 가져와서 체크하기)
    if (res.ORESULT_CUR.length > 0 && popupParam.DEPT_OBJ) {
      let result = res.ORESULT_CUR.map((item1, index1) => {
        let index2 = popupParam.DEPT_OBJ.findIndex((item2) => item2.ASGN_CD === item1.ASGN_CD)
        return index2 !== -1 ? index1 : -1
      }).filter((index) => index !== -1)
      grdMain.value.getGridView().checkRows(result)
    }

    dialog.value = true

    //2024-01-17 김현재 수정(현중측 요청으로 조회값이 단건일시 emit자동으로 올리는 기능 삭제)
    // if (res.ORESULT_CUR.length === 1) {
    //   emit("selected", res.ORESULT_CUR[0])
    // } else {
    //   //팝업 visible
    //   afterSearch(res)
    //   dialog.value = true
    // }
  })

  // 팝업 오픈 시 넘어오는 그리드 DataRow(그리드에 적용시킬려면 "dataRow"가 필요)
  // 작성자 : 이희원(2024-02-01)
  popParam.dataRow = popupParam.dataRow
  popParam.fieldIndex = popupParam.fieldIndex

  /*
  let func = commonSearchApi({ queryId : 'searchDept', param : options.values })

  var res = await func.then(res => {
    if (res.length === 1) {
      emit('selected', res)
    } else {
      //팝업 visible
      afterSearch(res)
      dialog.value = true
    }
  })
  */

  // 2024.06.07 박용훈 팝업이 오픈되고 나서 실행 되도록 위치 변경

  window.addEventListener('mousemove', mouseUpdate)
}

//초기 데이터셋팅
onMounted(() => {
  grdMain.value.getGridView().filterPanel.visible = true
  // 2024.06.07 박용훈 팝업이 오픈되고 나서 실행 되도록 위치 변경
  //initCodeList()
  //window.addEventListener('mousemove', mouseUpdate)
  // options.values.COL1 = "2"                    //key : TEXT
  /*
  options.values.COL2 = userStore.company     //autocomplates
  options.values.COL3 = dayjs().get("year")   //spinrealgrid-lic
  options.values.COL4 = ""                    //multi autocomplates
  options.values.COL5 = dayjs().format("YYYY-MM-DD")  //date
  options.values.COL6 = ""                    //Popup
  options.values.COL7 = ""                    //radio
  */
  //setGridEvents()
})

const onRgMainLoaded = () => {
  grdMain.value.gridView = rgMain.value.getGridView()
  grdMain.value.dataProvider = rgMain.value.getDataProvider()
}

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnSelect') {
    if (props.checkBar) {
      onSelectes()
    } else {
      onSelect()
    }
  } else if (btn.id === 'btnClose') {
    onClose()
  }
}

// 조회로직
const searchData = () => {
  return commonSearchApi({
    queryId: 'searchDept',
    param: options.values,
  })
}

/*메뉴버튼 조회*********************************************/
//필요에 따라 추가
const beforeSearch = async () => {
  grdMain.value.getDataProvider().setRows([])

  return true
}

const afterSearch = (res) => {
  let filters = []

  let dataProvider = grdMain.value.getDataProvider()
  dataProvider.setRows(res.ORESULT_CUR)

  // ILJOO_DUCHA 협력사 조회 필터 설정
  if (disable.value) {
    filters.push({ name: 'A0', criteria: "value like 'A0%'", active: true })
    filters.push({ name: 'AQ', criteria: "value like 'AQ%'", active: true })
    filters.push({ name: 'AC', criteria: "value like 'AC%'", active: true })

    grdMain.value.getGridView().setColumnFilters('ASGN_CD', filters)
  } else {
    grdMain.value.getGridView().clearColumnFilters('ASGN_CD') // 필터해제
  }
}

const onClose = (e) => {
  clearField()
  disable.value = false

  dialog.value = false
}

const onSelect = () => {
  var rowIdx = grdMain.value.getGridView().getCurrent().dataRow

  var rtnData = grdMain.value.getDataProvider().getJsonRow(rowIdx)

  // 팝업 오픈 시 넘어오는 그리드 DataRow(그리드에 적용시킬려면 "dataRow"가 필요)
  // 작성자 : 이희원(2024-02-01)
  rtnData.dataRow = popParam.dataRow
  rtnData.fieldIndex = popParam.fieldIndex

  emit('selected', rtnData)
  onClose()
}

const onSelectes = () => {
  let rtnData = []
  let chkRow = grdMain.value.getGridView().getCheckedRows(true)
  if (chkRow.length === 0) {
    Message.warn(t('부서를 선택해주세요.'))
    return false
  }
  for (let i = 0; i < chkRow.length; i++) {
    let checkedData = grdMain.value.getDataProvider().getJsonRow(chkRow[i])
    rtnData.push(checkedData)
  }
  emit('selected', rtnData)

  onClose()
}

defineExpose({
  openPopup,
})

//mouse coordinate
const x = ref(0)
const y = ref(0)

const mouseUpdate = (event) => {
  // let gapx = event.pageX - x.value
  x.value = event.pageX
  y.value = event.pageY
}

//2024-01-18 김현재 추가
const clearField = () => {
  grdMain.value.getDataProvider().setRows(null)
  options.values.BSNS_CD = ''
  options.values.ASGN_NM = ''
}

/*2024-02-06 김현재 추가
한민규 매니저 요청으로
사업부 변경시 부서명,그리드 초기화 기능 추가
*/
watch(
  () => options.values.CMPNY_DIV,
  (newValue, oldValue) => {
    commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: options.values.CMPNY_DIV, USE_DIV: 'Y' },
    }).then((res) => {
      codeList.bsnsCd = res.ORESULT_CUR
      codeList.bsnsCd.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    }) // 사업부
    let gridData = grdMain.value.getDataProvider().getRows()
    if (gridData.length > 0) {
      options.values.ASGN_NM = ''
      options.values.BSNS_CD = ''
      options.values.DEPT_CD = ''
      grdMain.value.getDataProvider().setRows(null)
    }
  }
)

watch(
  () => options.values.BSNS_CD,
  (newValue, oldValue) => {
    let gridData = grdMain.value.getDataProvider().getRows()
    if (gridData.length > 0) {
      options.values.ASGN_NM = ''
      options.values.DEPT_CD = ''
      grdMain.value.getDataProvider().setRows(null)
    }
  }
)
/*2024-03-08 김현재 추가
팀이름 체크박스 체크시 부서 최하위 조직 검색
*/
watch(
  () => options.values.USE_TEAM,
  () => {
    if (options.values.USE_TEAM === 'Y') {
      grdMainProps.field[6].visible = true
      grdMainProps.field[6].width = '150'
      grdMainProps.field[6].header = { text: t('하위조직명') }
      grdMainProps.field[5].visible = false
      grdMainProps.field = grdMainProps.columns
      grdMain.value.getGridView().setColumns(grdMainProps.columns)
      grdMain.value.setBindingColumn('CMPNY_DIV', codeList.company, 'COD', 'TXT') // 회사구분
      grdMain.value.setBindingColumn('BSNS_CD', codeList.bsnsCd, 'BSNS_CD', 'BSNS_NM') // 사업부
      grdMain.value.setBindingColumn('ORGN_DIV', codeList.orgnDiv, 'code', 'name') // 구분
    } else {
      grdMainProps.field[6].visible = false
      grdMainProps.field[5].visible = true
      grdMainProps.field = grdMainProps.columns
      grdMain.value.getGridView().setColumns(grdMainProps.columns)
      grdMain.value.setBindingColumn('CMPNY_DIV', codeList.company, 'COD', 'TXT') // 회사구분
      grdMain.value.setBindingColumn('BSNS_CD', codeList.bsnsCd, 'BSNS_CD', 'BSNS_NM') // 사업부
      grdMain.value.setBindingColumn('ORGN_DIV', codeList.orgnDiv, 'code', 'name') // 구분
    }
  }
)

//라디오박스 변경시 자동조회
watch(
  () => options.values.ORGN_DIV,
  () => {
    onButtonsClick({ id: 'btnSearch' })
  }
)

const deptValidation = (value) => {
  options.values.DEPT_CD = options.values.DEPT_CD.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '')
}
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    width="900"
    height="780"
    class="p-absolute user-select-none"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>소속조회</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <IGridTitle
          :use-permission="false"
          :button-list="['btnSearch', 'btnSelect', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <div class="d-flex">
              <i-select
                v-model="options.values.CMPNY_DIV"
                top-label
                :label="$t('회사구분')"
                width="270px"
                required
                :items="codeList.company"
                item-value="COD"
                item-title="TXT"
                :disabled="options.disabled.CMPNY_DIV"
              />
              <VRadioGroup
                v-model="options.values.ORGN_DIV"
                class="mt-auto mb-1"
                :disabled="options.disabled.ORGN_DIV"
                inline
              >
                <VRadio v-for="(item, i) in codeList.orgnDiv" :key="i" :value="item.code" :label="item.name" />
              </VRadioGroup>
              <!-- 사업부 -->
            </div>
            <div class="d-flex mt-2">
              <i-select
                v-model="options.values.BSNS_CD"
                top-label
                :label="$t('사업부')"
                width="270px"
                :items="codeList.bsnsCd"
                item-value="BSNS_CD"
                item-title="BSNS_NM"
              />
              <i-input
                v-model="options.values.ASGN_NM"
                top-label
                width="250px"
                :label="strASGN_NM"
                @keydown.enter="() => onButtonsClick({ id: 'btnSearch' })"
              />
              <i-input
                v-model="options.values.DEPT_CD"
                top-label
                width="250px"
                :label="strDEPT_CD"
                :rules="[deptValidation]"
                @keydown.enter="() => onButtonsClick({ id: 'btnSearch' })"
              />
              <!-- 부서명 -->
            </div>
            <!-- HSESYS 제외 -->
            <div class="d-flex mt-2">
              <!-- 요청으로 삭제 2024.07.04 염인식
              <VCheckbox
                v-model="options.values.HSE_ONLY"
                :label="$t(hseLabel)"
                :disabled="options.disabled.HSE_ONLY"
                class="mr-5"
              />
              -->
              <!-- 과거조직포함 -->
              <VCheckbox
                v-model="options.values.USE_ONLY"
                :label="$t('과거조직포함')"
                true-value="N"
                false-value="Y"
                :disabled="options.disabled.USE_OLNY"
                class="mr-5"
              />
              <VCheckbox
                v-model="options.values.USE_TEAM"
                :label="$t('과/팀 이름조회')"
                true-value="Y"
                false-value="N"
                :disabled="options.disabled.USE_TEAM"
              />
            </div>
          </v-sheet>
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              class="mt-2"
              :gridViewOption="grdMainProps.gridViewOption"
              :fields="grdMainProps.field"
              :columns="grdMainProps.columns"
              @onCellDblClicked="onSelect"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>
