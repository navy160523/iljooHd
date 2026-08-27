<!--
  화면명 : 수시 위험성평가 등록/현황 - 참석자 조회 팝업
  화면개요 : 메인 화면
-->
<script setup>
import { ref, reactive, onMounted } from "vue"
import { useUserStore } from "@hiway/stores/user"
import { commonRequest } from "@hiway/api/commonApi"
import RealGridFactory from "@/utils/realgrid2"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import queryFlowHelper from "@/utils/searchFlowHelper"
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from "@hiway/api/commonApi"
import { useI18n } from "vue-i18n"
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from "@hiway/utils/notify"
import { startDragging, handleDragging, stopDragging } from "@/utils/useDrag"
// import SelectEmpPopup from '@/pages/20_risk-assessment/RSK_D/Popup/RSKDA0020Popup01.vue'
import FileUpload from '@/pages/20_risk-assessment/RSK_C/Popup/RSKCA0010Popup02.vue'
import { lte } from "lodash-es"

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const searchArea = ref(null)
const t = useI18n().t //다국어
const emit = defineEmits(["selected", "closed"])
const dialog = ref(false)

const grdMain = ref(null)
const grdSub = ref(null)

let grdParams = reactive([])

// 팝업 오픈 시 데이터
let openParams = reactive({
  title: '',
  dataRow: null,
  fieldIndex: null,
  BSNS_CD: '',
  DEPT_CD: '',
  NROUTINE_WORK_ID: ''
})

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  DEPT_CD: '',
  ASGN_CD: '',
  EMP_NO: '',
  EMP_NM: '',
  FLAG: 'N',
  USER_DIV: '',
})

// 코드리스트
const codeList = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [],
  DEPT_CD: [],
  ASGN_CD: [],
  USER_DIV: [
    { COD: "", TXT: "전체" },
    { COD: "A", TXT: "직영" },
    { COD: "B", TXT: "사내협력사" },
    { COD: "D", TXT: "단기공사" },
  ]
})

// 코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    // 회사
    getCompanyList(),
    // 사업부
    commonSearchApi({
      queryId: "searchBSNS",
      param: { 
        CMPNY_DIV: userStore.cmpnyDiv, 
        USE_DIV: "N" 
      },
    }), 
    // 부서
    commonSearchApi({
      queryId: "searchDept3",
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: null, USE_DIV: "Y" },
    })
  ]).then((res) => {
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.DEPT_CD = res[2].ORESULT_CUR

    codeList.BSNS_CD.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
    codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
  })
}

// 메인 그리드 세팅
const grdMainProps = reactive({
  gridViewOption: {
    checkBar: { visible: true },
    edit: { editable: false },
    stateBar: { visible: false },
  },
  keys: ["CMPNY_DIV"],
  field: [
    {
      fieldName: "USER_DIV",
      dataType: "text",
      width: "90",
      header: { text: t("소속구분") },
      lookupDisplay: true,
      lookupData: { value: "COD", label: "TXT", list: codeList.USER_DIV },
    },
    {
      fieldName: "ASGN_NM",
      dataType: "text",
      width: "300",
      styleName: "left-column",
      header: { text: t("소속") },
    },
    {
      fieldName: "EMP_NO",
      dataType: "text",
      width: "90",
      header: { text: t("사번") },
    },
    {
      fieldName: "JOB_TIT_NM",
      dataType: "text",
      width: "90",
      header: { text: t("직급") },
    },
    {
      fieldName: "EMP_NM",
      dataType: "text",
      width: "90",
      header: { text: t("성명") },
    },
    {
      fieldName: "TEL_NO",
      dataType: "text",
      width: "90",
      header: { text: t("사내번호") },
    },
    {
      fieldName: "HLD_OFFI_GBN",
      dataType: "text",
      header: { text: t("재직여부") },
    },
    // 출력 안함
    { fieldName: "BIRTH_DAY", dataType: "text", visible: false },
    { fieldName: "ADDR", dataType: "text", visible: false },
    { fieldName: "ADDR1", dataType: "text", visible: false },
    { fieldName: "AGE", dataType: "text", visible: false },
    { fieldName: "AGE_KOR", dataType: "text", visible: false },
    { fieldName: "ASGN_CD", dataType: "text", visible: false },
    { fieldName: "ASGN_SHRT_NM", dataType: "text", visible: false },
    { fieldName: "BSNS_CD", dataType: "text", visible: false },
    { fieldName: "BSNS_NM", dataType: "text", visible: false },
    { fieldName: "CMPNY_DIV", dataType: "text", visible: false },
    { fieldName: "COMPANY", dataType: "text", visible: false },
    { fieldName: "COM_ENT_DATE", dataType: "text", visible: false },
    { fieldName: "DEPT_CD", dataType: "text", visible: false },
    { fieldName: "DEPT_NM", dataType: "text", visible: false },
    { fieldName: "EMAIL", dataType: "text", visible: false },
    { fieldName: "ENG_NM", dataType: "text", visible: false },
    { fieldName: "GRD_CD", dataType: "text", visible: false },
    { fieldName: "GRD_NM", dataType: "text", visible: false },
    { fieldName: "JIKJONG_CD", dataType: "text", visible: false },
    { fieldName: "JOB_DEPT_CD", dataType: "text", visible: false },
    { fieldName: "JOB_DEPT_NM", dataType: "text", visible: false },
    { fieldName: "JOB_GRP_CD", dataType: "text", visible: false },
    { fieldName: "JOB_ROW_CD", dataType: "text", visible: false },
    { fieldName: "JOB_ROW_NM", dataType: "text", visible: false },
    { fieldName: "JOB_TIT_CD", dataType: "text", visible: false },
    { fieldName: "MARR_YN", dataType: "text", visible: false },
    { fieldName: "OFFI_RES_CD", dataType: "text", visible: false },
    { fieldName: "OFFI_RES_NM", dataType: "text", visible: false },
    { fieldName: "RESM_DATE", dataType: "text", visible: false },
    { fieldName: "RETI_TMP_DATE", dataType: "text", visible: false },
    { fieldName: "SEX", dataType: "text", visible: false },
    { fieldName: "STD_DUTY_CD", dataType: "text", visible: false },
    { fieldName: "STD_DUTY_NM", dataType: "text", visible: false },
    { fieldName: "HND_PHN", dataType: "text", visible: false },
    { fieldName: "TMP_RST_DATE", dataType: "text", visible: false },
    { fieldName: "TMP_RST_RSN", dataType: "text", visible: false },
    { fieldName: "UNT_DUTY_CD", dataType: "text", visible: false },
    { fieldName: "UNT_DUTY_NM", dataType: "text", visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.field

// SubGrid Setting
const grdSubProps = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: false } },
  keys: ["EMP_NO"],
  field: [
    { fieldName: "EMP_NM", dataType: "text", header: { text: t("성명") } },
    { fieldName: "JOB_TIT_NM", dataType: "text", header: { text: t("직급") } },
    { fieldName: "EMP_NO", dataType: "text", header: { text: t("사번") } },

    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
  ],
  columns: [],
})

grdSubProps.columns = grdSubProps.field

// 팝업 오픈
const openPopup = async popupParam => {
  dialog.value = true
  
  // 공통 코드 불러오기
  initCodeList()

  grdParams = []

  openParams.title = popupParam.title
  openParams.dataRow = popupParam.dataRow
  openParams.fieldIndex = popupParam.fieldIndex
  openParams.NROUTINE_WORK_ID = popupParam.NROUTINE_WORK_ID
  openParams.BSNS_CD = popupParam.BSNS_CD
  openParams.DEPT_CD = popupParam.DEPT_CD

  // PARYT_MEMBERS ',' 분리
  if (popupParam.PARYT_MEMBERS !== '') {
    for (let val of popupParam.PARYT_MEMBERS) {
      await commonSearchApi({ 
        queryId : 'searchUserInfo',
        param : { 
          CMPNY_DIV: userStore.cmpnyDiv, 
          EMP_NO: val.trim(),
        },
      }).then(res => {
        console.log('res ', res)
        grdParams.push(res.ORESULT_CUR[0])
      })
    }
    console.log('grdParams :: ', grdParams)
    grdSub.value.getDataProvider().setRows(grdParams)
  } else {
    grdSub.value.getDataProvider().setRows([])
  }
}

// 버튼 클릭 이벤트
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnSelect') {
    onSelect({ clickType : "check" })
  } else if (btn.id === 'btnClose') {
    onClose()
  } else if (btn.id === 'btnDelete') {
    deleteData()
  }
}

// Enter 이벤트
const enterSearch = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setBefore(beforeSearch)
    .setQuery(searchData)
    .setAfter(afterSearch)
    .run()
}

// 조회
const beforeSearch = async () => {
  if (!searchParams.DEPT_CD && !searchParams.EMP_NM && !searchParams.EMP_NO) {
    return Message.err("부서를 선택하거나 사번 및 성명을 입력해주세요.")
  }

  return true
}

const searchData = () => {
  return commonSearchApi({ queryId: "searchEMP", param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 더블 클릭 이벤트 (인원 선택)
const onCellDblClicked = (grid, clickData) => {
  let rtnData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)

  // onSelect 함수에서 더블클릭인지 체크인지 상태를 확인하기 위함.
  rtnData.clickType = 'double'
  rtnData.dataRow = clickData.dataRow

  onSelect(rtnData)
}

// 인원 선택
const onSelect = async val => {
  let checkedRowData = []

  // 더블 클릭 시
  if (val.clickType === 'double') {
    checkedRowData.push({
      CMPNY_DIV: val.CMPNY_DIV,
      BSNS_CD: val.BSNS_CD,
      DEPT_CD: val.DEPT_CD,
      EMP_NM: val.EMP_NM,
      JOB_TIT_NM: val.JOB_TIT_NM,
      EMP_NO: val.EMP_NO,
    })
  } else if (val.clickType === 'check') {
    // checkBox 선택 후 "선택" 버튼 클릭 시
    let checkedRow = grdMain.value.getGridView().getCheckedRows()

    if (checkedRow.length === 0) {
      return Message.warn(t("선택한 데이터가 없습니다."))
    }

    for (let i of checkedRow) {
      let pushArr = grdMain.value.getDataProvider().getJsonRow(i)

      checkedRowData.push({
        CMPNY_DIV: pushArr.CMPNY_DIV,
        BSNS_CD: pushArr.BSNS_CD,
        DEPT_CD: pushArr.DEPT_CD,
        EMP_NM: pushArr.EMP_NM,
        JOB_TIT_NM: pushArr.JOB_TIT_NM,
        EMP_NO: pushArr.EMP_NO,
      })

      // 체크 자동 해제
      grdMain.value.getGridView().checkRow(i, false)
    }
  }

  // 참석자 현황 그리드로 데이터 넘김
  if (checkedRowData.length > 0) {
    let allSubData = grdSub.value.getDataProvider().getJsonRows()

    // 인원 검색 및 참석자 선택 그리드에서 선택한 데이터
    for (let item of checkedRowData) {
      let isDuplicate = false

      // 참석자 현황 그리드 전체 데이터
      for (let exist of allSubData) {
        // 중복 체크
        if (item.EMP_NO === exist.EMP_NO) {
          isDuplicate = true
        }
      }
      if (!isDuplicate) {
        grdSub.value.addRow({
          CMPNY_DIV: item.CMPNY_DIV,
          BSNS_CD: item.BSNS_CD,
          DEPT_CD: item.DEPT_CD,
          EMP_NM: item.EMP_NM,
          JOB_TIT_NM: item.JOB_TIT_NM,
          EMP_NO: item.EMP_NO,
        })
      }
    }
    // 체크 자동 해제
    grdSub.value.getGridView().setAllCheck(false)
  }
  
  // 형식 수정 후 저장
  let changeRowData = grdSub.value.getDataProvider().getJsonRows()
  let values = changeRowData.map(item => item.EMP_NO)
  let result = values.join(',')

  let newArr = {
    PARYT_MEMBERS: changeRowData.map(item => item.EMP_NO),
    SHOW_MEMBERS: changeRowData.map(item => item.EMP_NM),
    dataRow: openParams.dataRow,
    fieldIndex: openParams.fieldIndex
  }

  // 저장 API
  if (openParams.NROUTINE_WORK_ID) {
    commonExecuteApi({
      queryId : 'RSKCA0010_POPUP_UPDATE_01',
      list: [{
        NROUTINE_WORK_ID: openParams.NROUTINE_WORK_ID,
        PARYT_MEMBERS: result
      }],
    }).then(res => {
      console.log(res)
      if (res.result.status === '200') {
        //emit("selected", res.list[0])
        emit("selected", newArr)
      }
    }).catch(err => {
      return Message.err(err)
    }).finally(() => {
      Message.success(t('저장되었습니다.'))
    })
  } else {
    emit("selected", newArr)
  }
}

// 팝업 닫기
const onClose = () => {
  dialog.value = false
  emit('closed')
}

// 삭제
const deleteData = () => {
  let checkedData = []

  // 참석자 현황 그리드 전체 데이터에서 사번(EMP_NO) 가져오기
  let allData = grdSub.value.getDataProvider().getJsonRows().map(el => el.EMP_NO)

  let checkedRow = grdSub.value.getGridView().getCheckedRows()

  // check 확인
  if (checkedRow.length === 0) {
    return Message.warn(t("선택한 데이터가 없습니다."))
  }

  for (let i of checkedRow) {
    // 선택된 데이터의 사번(EMP_NO) 가져오기
    checkedData.push(grdSub.value.getDataProvider().getJsonRow(i).EMP_NO)

    // 그리드에서 제거
    grdSub.value.getDataProvider().removeRow(i)
  }

  // checkedData에서 포함되지 않는 요소만 필터링하여 새 배열
  let newArr = allData.filter(item => !checkedData.includes(item))
  // []의 결과를 콤마로 구분하여 String 타입으로 변환
  let result = newArr.join(',')

  vm.$swal({
    title: t('삭제 하시겠습니까?'), 
    showCancelButton: true,
  }).then(swalRes => {
    if(swalRes.isConfirmed === true) {
      commonExecuteApi({
        queryId : 'RSKCA0010_POPUP_UPDATE_01',
        list: [{
          NROUTINE_WORK_ID: openParams.NROUTINE_WORK_ID,
          PARYT_MEMBERS: result
        }],
      }).then(res => {
        console.log(res)
        if (res.result.status === '200') {
          emit("selected", res.list[0].NROUTINE_WORK_ID)
        }
      }).catch(err => {
        return Message.err(err)
      }).finally(() => {
        Message.success(t('삭제 되었습니다.'))
      })
    }
  })
}

// 사업부 변경 시 부서 변경 이벤트
watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  commonSearchApi({ 
    queryId : 'searchDept3', 
    param : { 
      CMPNY_DIV: userStore.cmpnyDiv, 
      BSNS_CD: newValue, 
      USE_DIV:'Y' 
    } 
  }).then(res => {
      codeList.DEPT_CD = res.ORESULT_CUR
      codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" })

      if (newValue !== oldValue) {
        searchParams.DEPT_CD = codeList.DEPT_CD[0].DEPT_CD
      }
    })
})

// 부서가 바뀌면 협력사 데이터 가져옴
watch(() => searchParams.DEPT_CD, (newValue, oldValue) => {  
  commonSearchApi({ queryId : 'searchVend', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParams.BSNS_CD, DEPT_CD: newValue } })
    .then(res => {
      codeList.ASGN_CD = res.ORESULT_CUR
      codeList.ASGN_CD.unshift({ ASGN_NM:"선택안함", ASGN_CD:"" })
      if (codeList.ASGN_CD.length !== 0) {
        searchParams.ASGN_CD = ''
      }
    })  
})

defineExpose({
  openPopup,
})
</script>

<template>
  <VDialog 
    v-model="dialog" 
    eager 
    persistent 
    width="1000" 
    class="draggable-dialog"
    @mousemove="handleDragging" 
    @mouseup="stopDragging"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>수시 위험성평가(비일상작업) 참석자</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-0">
        <IGridTitle
          :title="$t('인원 검색 및 참석자 선택')"
          :use-permission="false"
          :button-list="['btnSearch', 'btnSelect', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <!-- 조회조건 -->
            <div class="d-flex">
              <!-- 회사 -->
              <i-select
                v-model="searchParams.CMPNY_DIV"
                :label="$t('회사')"
                labelWidth="50px"
                width="300px"
                :items="codeList.CMPNY_DIV"
                item-value="COD"
                item-title="TXT"
                readonly
              />
              <!-- 사업부 -->
              <i-select
                v-model="searchParams.BSNS_CD"
                :label="$t('사업부')"
                labelWidth="50px"
                width="300px"
                :items="codeList.BSNS_CD"
                item-value="BSNS_CD"
                item-title="BSNS_NM"
              />
              <!-- 부서 -->
              <i-select
                v-model="searchParams.DEPT_CD"
                :label="$t('부서')"
                labelWidth="50px"
                width="300px"
                :items="codeList.DEPT_CD"
                item-value="DEPT_CD"
                item-title="DEPT_NM"
              />
            </div>
            <div class="d-flex mt-2">
              <i-input 
                v-model="searchParams.EMP_NO"
                :label="$t('사번')"
                labelWidth="50px"
                width="300px"
                @keydown.enter="(e) => enterSearch(e)"
              />
              <i-input
                v-model="searchParams.EMP_NM"
                :label="$t('성명')"
                labelWidth="50px"
                width="300px"
                @keydown.enter="(e) => enterSearch(e)"
              />
              <!-- 협력사 -->
              <i-select
                v-model="searchParams.ASGN_CD"
                :label="$t('협력사')"
                labelWidth="50px"
                width="300px"
                :items="codeList.ASGN_CD"
                item-value="ASGN_CD"
                item-title="ASGN_NM"
              />
            </div>
          </v-sheet>
          <!-- 인원 조회 그리드 -->
          <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              class="border rounded"
              :gridViewOption="grdMainProps.gridViewOption"
              :fields="grdMainProps.field"
              :columns="grdMainProps.columns"
              @onCellDblClicked="onCellDblClicked"
            />
          </v-sheet>
          <!-- 선택한 인원 그리드 -->
          <v-sheet class="h-auto mt-2">
            <IGridTitle 
              :title="$t('참석자 현황')"
              :button-list="['btnDelete']"
              @click-button="onButtonsClick"
            >
              <template #editors />
            </IGridTitle>
            <RealGrid
              ref="grdSub"
              class="border rounded"
              :gridViewOption="grdSubProps.gridViewOption"
              :fields="grdSubProps.field"
              :columns="grdSubProps.columns"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
  </VDialog>
</template>

<style scoped lang="scss">
.draggable-dialog {
  position: absolute;
  user-select: none;
}

.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}
</style>
