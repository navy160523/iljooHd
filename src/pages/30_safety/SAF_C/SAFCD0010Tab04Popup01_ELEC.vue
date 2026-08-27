<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  selectFunction,
} from '@hiway/api/commonApi'
import RealGrid from '@/components/RealGrid.vue'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import saveFlowHelper from '@/utils/saveFlowHelper'
import queryFlowHelper from '@/utils/searchFlowHelper'
import Message from '@hiway/utils/notify'
import { startDragging, handleDragging, stopDragging } from '@/utils/useDrag'
import dayjs from 'dayjs'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
defineOptions({
  name: '30_safety_SAF_C-SAFCD0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const dialog = ref(false)
const title = ref('부서관리작업 점검결과 등록')
const fileUploadPopup = ref(null)
const userStore = useUserStore()
const emit = defineEmits(['closePopup'])
const deptMngField = reactive({
  WORK_ID: '', //작업지시번호
  CMPNY_DIV: '', //사업부
  DEPT_NM: '', //소속부서
  ASGN_NM: '', //소속조직
  WORK_DATE: '', //작업일
  RESP_EMP_NM: '', //작업책임자
  DESCRIPTION: '', //위험유형
  WSNAME: '', //작업표준서
  WRK_DIST: '', //작업명
  WORK_TITLE: '', //작업내용
  AREA_NM: '', //작업장소
  AREA_DETAIL: '', //작업장소상세위치
  AREA_FULL_NM: '', // 상세위치
  CHECK_DATE: '', //점검일시
  CHECK_TIME: '', //점검시간
  D_WRK_ID: '', //부서 관리 작업 대상 ID
})

const codeList = reactive({
  CMPNY_DIV: [], //작업소속 사업부
  CHECK_GROUP: [], //그룹
})

const grdMainProps = reactive({
  fields: [
    {
      fieldName: 'CHECK_EMP_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('점검자') },
    },
    {
      fieldName: 'CHECK_EMP_NO',
      dataType: 'text',
      editable: false,
      header: { text: t('사번') },
    },
    {
      fieldName: 'CHECK_GROUP',
      dataType: 'text',
      editable: false,
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
      header: { text: t('그룹') },
    },
  ],
  columns: [],
})

const grdSubProps = reactive({
  fields: [
    {
      fieldName: 'CHECK_DESC',
      dataType: 'text',
      width: '200',
      editable: false,
      header: { text: t('점검내용') },
    },
    {
      fieldName: 'OK',
      dataType: 'text',
      width: '50',
      editable: false,
      renderer: {
        type: 'check',
        trueValues: '1',
        falseValues: '0',
      },
      header: { text: t('양호') },
    },
    {
      fieldName: 'NG',
      dataType: 'text',
      width: '50',
      editable: false,
      renderer: {
        type: 'check',
        trueValues: '0',
        falseValues: '1',
      },
      header: { text: t('불량') },
    },
    {
      fieldName: 'CHECK_DEFECT',
      dataType: 'text',
      styleName: 'editable_column',
      header: { text: t('불량내용') },
    },
    {
      fieldName: 'CHECK_PIC',
      dataType: 'text',
      editable: false,
      width: '50',
      header: { text: t('사진첨부') },
      isFile: { value: true, showAlways: true },
    },
    {
      fieldName: 'CHECK_SEQ',
      visible: false,
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields
grdSubProps.columns = grdSubProps.fields

onMounted(() => {})

const initCodeList = () => {
  Promise.all([getCodeList('HHIZ000'), getCodeList('HHIP050')]).then((res) => {
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    codeList.CHECK_GROUP = res[1].ORESULT_CUR
    grdMain.value.setBindingColumn(
      'CHECK_GROUP',
      codeList.CHECK_GROUP,
      'COD',
      'TXT'
    )
  })
}

const openPopup = (data) => {
  console.log('받은데이터', data)
  vm.$nextTick(() => {
    initCodeList()
    defaultDate()
    for (const [key, value] of Object.entries(data)) {
      if (deptMngField.hasOwnProperty(key)) {
        deptMngField[key] = value
      }
    }
    initGrdMain(data)
    initGrdSub(data)
  })

  dialog.value = true
}

const openPopup2 = (data) => {
  vm.$nextTick(() => {
    initCodeList()
    defaultDate()
    for (const [key, value] of Object.entries(data)) {
      if (deptMngField.hasOwnProperty(key)) {
        deptMngField[key] = value
      }
    }
    title.value = '부서관리작업 점검결과 수정'
    modifyGrdMain(data)
    modifyGrdSub(data)
    dialog.value = true
  })
}

const closePopup = () => {
  for (let i in deptMngField) {
    deptMngField[i] = ''
  }
  grdMain.value.getDataProvider().setRows(null)
  grdSub.value.getDataProvider().setRows(null)
  menuTitle.value.disableBtn('btnUpdate', false) //저장버튼 활성화
  title.value = '부서관리작업 점검결과 등록'
  emit('closePopup')
  dialog.value = false
}

// //수정시 점검자 리스트 조회
const modifyGrdMain = () => {

  console.log("modifyGrdMain start")
  let param = {
    CMPNY_DIV: deptMngField.CMPNY_DIV, //사업장
    WORK_ID: deptMngField.WORK_ID, //작업지시 ID
    D_WRK_ID: deptMngField.D_WRK_ID, //PTW 대상 ID
  }
  commonSearchApi({
    queryId: 'SAFCD0010_ELEC_SEARCH89',
    param: param,
  }).then((res) => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    grdMain.value.getGridView().setFocus(0)
  })
}

//수정시 점검결과 조회
const modifyGrdSub = () => {
  let param = {
    CMPNY_DIV: deptMngField.CMPNY_DIV, //사업장
    WORK_ID: deptMngField.WORK_ID, //작업지시 ID
    D_WRK_ID: deptMngField.D_WRK_ID, //PTW 대상 ID
  }
  commonSearchApi({
    queryId: 'SAFCD0010_ELEC_SEARCH88',
    param: param,
  }).then((res) => {
    grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
    for (let i = 0; i < res.ORESULT_CUR.length; i++) {
      if (res.ORESULT_CUR[i].CHECK_RESULT === '1') {
        grdSub.value
          .getDataProvider()
          .setValue(i, 'OK', res.ORESULT_CUR[i].CHECK_RESULT)
      } else {
        grdSub.value
          .getDataProvider()
          .setValue(i, 'NG', res.ORESULT_CUR[i].CHECK_RESULT)
      }
    }
  })
}

const onGrdMainCurrRowChanged = (grid, oldIdx, newIdx) => {
  if (!title.value.includes('등록')) {
    let row = grdMain.value.getDataProvider().getJsonRow(newIdx)
    //점검자 리스트에서 본인 사번과 일치하지 않으면 저장버튼 비활성화
    if (row.CHECK_EMP_NO !== userStore.empNo) {
      menuTitle.value.disableBtn('btnUpdate', false) //저장버튼 비활성화
    } else {
      // 일단 저장버튼은 활성화 (2024.12.29)
      menuTitle.value.disableBtn('btnUpdate', false) //저장버튼 활성화
    }
    //부서관리 점검항목 조회 파라미터
    let param = {
      CMPNY_DIV: userStore.cmpnyDiv,
      WORK_ID: deptMngField.WORK_ID,
      D_WRK_ID: deptMngField.D_WRK_ID,
      CHECK_EMP_NO: row.CHECK_EMP_NO,
    }
    commonSearchApi({
      queryId: 'SAFCD0010_ELEC_SEARCH88',
      param: param,
    }).then((res) => {
      grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
      for (let i = 0; i < res.ORESULT_CUR.length; i++) {
        if (res.ORESULT_CUR[i].CHECK_RESULT === '1') {
          grdSub.value
            .getDataProvider()
            .setValue(i, 'OK', res.ORESULT_CUR[i].CHECK_RESULT)
        } else {
          grdSub.value
            .getDataProvider()
            .setValue(i, 'NG', res.ORESULT_CUR[i].CHECK_RESULT)
        }
      }
    })
    //점검자별 점검등록 시간 조회
    commonSearchApi({
      queryId: 'SAFCD0010_SEARCH87',
      param: param,
    }).then((res) => {
      if (res.ORESULT_CUR.length > 0) {
        deptMngField.CHECK_TIME = res.ORESULT_CUR[0].CHECK_TIME
      }
    })
  }
}

//점검자 리스트 세팅(등록버튼 눌렀을때 로그인유저 세팅)
const initGrdMain = (data) => {
  let grdMainRow = {
    CHECK_EMP_NM: '',
    CHECK_EMP_NO: '',
    CHECK_GROUP: '',
  }
  grdMainRow.CHECK_EMP_NM = userStore.empNm
  grdMainRow.CHECK_EMP_NO = userStore.empNo
  selectFunction({
    queryId: 'GET_AUTH_GRADE',
    EMP_NO: userStore.empNo,
  }).then((res) => {
    let grade = res.ORESULT_CUR
    if (grade === 'A0') {
      //안전요원
      grdMainRow.CHECK_GROUP = 'A0'
      grdMain.value.addRow(grdMainRow)
    }
    //관리감독자
    else if (grade === 'B0') {
      grdMainRow.CHECK_GROUP = 'B0'
      grdMain.value.addRow(grdMainRow)
    }
    //협력사 관리감독자
    else if (grade === 'B1') {
      grdMainRow.CHECK_GROUP = 'B1'
      grdMain.value.addRow(grdMainRow)
    }
    //세잎클로버
    else if (grade === 'C0') {
      grdMainRow.CHECK_GROUP = 'C0'
      grdMain.value.addRow(grdMainRow)
    }
    //협력사 안전요원
    else if (grade === 'C1') {
      grdMainRow.CHECK_GROUP = 'C1'
      grdMain.value.addRow(grdMainRow)
    } else if (grade === 'E0') {
      //기타
      grdMainRow.CHECK_GROUP = 'E0'
      grdMain.value.addRow(grdMainRow)
    }
    //퇴사자 또는 미확인
    else {
      grdMainRow.CHECK_GROUP = 'Z0'
      grdMain.value.addRow(grdMainRow)
    }
    grdMain.value.getGridView().setFocus(0)
  })
}

//D_WORK_ID에 해당하는 체크리스트 불러오기(등록버튼 눌렀을때)
const initGrdSub = (data) => {
  setTimeout(() => {
    let param = {
      CMPNY_DIV: userStore.cmpnyDiv,
      D_WRK_ID: data.D_WRK_ID,
    }
    commonSearchApi({
      queryId: 'SAFCD0010_SEARCH90',
      param: param,
    }).then((res) => {
      grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
    })
  }, 300)
}

//메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  } else {
    closePopup()
  }
}

//저장관련 로직 시작
const beforeSave = () => {
  if (!deptMngField.CHECK_TIME) {
    Message.warn(t('작업일시는 필수값입니다.'))
    return false
  }
  return true
}

const saveData = () => {
  let saveParam = []
  let grdSubData = grdSub.value.getDataProvider().getJsonRows()
  let grdMainData = grdMain.value.getFocusedRowData()
  for (let i = 0; i < grdSubData.length; i++) {
    let saveData = {
      CMPNY_DIV: userStore.cmpnyDiv,            // 사업장
      WORK_ID: deptMngField.WORK_ID,            // 작업지시No
      CHECK_EMP_NO: grdMainData.CHECK_EMP_NO,   // 점검자 사번
      D_WRK_ID: deptMngField.D_WRK_ID,          // 부서 관리 작업 대상 ID
      CHECK_SEQ: grdSubData[i].CHECK_SEQ,       // 점검내용No
      CHECK_GROUP: grdMainData.CHECK_GROUP,     // 점검그룹
      CHECK_RESULT:
        grdSubData[i].OK === '1' ? grdSubData[i].OK : grdSubData[i].NG, //점검결과
      CHECK_DEFECT: grdSubData[i].CHECK_DEFECT, // 불량내용
      CHECK_PIC: grdSubData[i].CHECK_PIC,       // 첨부파일ID
      CHECK_DEPT_CD: userStore.deptCd,          // 점검자 부서
      CHECK_BSNS_CD: userStore.bsnsCd,          // 점검자 사업부
      CHECK_ASGN_CD: userStore.asgnCd,          // 점검자 소속
      CHECK_DATE: deptMngField.CHECK_DATE,      // 점검일시
      CHECK_TIME: deptMngField.CHECK_TIME,      // 점검시간
      USER_ID: userStore.userId,
    }
    saveParam.push(saveData)
  }
  return commonExecuteApi({
    queryId: 'SAFCD0010_ELEC_SAVE07',
    list: saveParam,
  })
}

const afterSave = () => {
  closePopup()
}

const onCellClicked = (grid, clickData) => {
  if (clickData.fieldName === 'OK') {
    grdSub.value.getDataProvider().setValue(clickData.dataRow, 'NG', '1')
  }
  if (clickData.fieldName === 'NG') {
    grdSub.value.getDataProvider().setValue(clickData.dataRow, 'OK', '0')
  }
}

//파일첨부 관련 로직 시작
const onCellButtonClicked = (grid, index, col) => {
  let data = grdSub.value.getDataProvider().getJsonRow(index.dataRow)
  //파일아이디 없을때 파일아이디 저장
  if (!data.CHECK_PIC) {
    fileUploadPopup.value.setGuid()
    let fileID = fileUploadPopup.value.guid
    grdSub.value.getDataProvider().setValue(col.dataRow, 'CHECK_PIC', fileID)
    grdSub.value.getGridView().checkItem(col.dataRow, true)
    fileUploadPopup.value.openPopup(fileID)
  } else {
    fileUploadPopup.value.openPopup(data.CHECK_PIC)
  }
}

const defaultDate = () => {
  let date = dayjs()

  deptMngField.CHECK_DATE =
    date.get('year') +
    '-' +
    (date.get('month') + 1).toString().padStart(2, '0') +
    '-' +
    date.get('date').toString().padStart(2, '0')
}

//점검시간 최대값은 현재시각
//점검날짜가 오늘날짜면 현재시각 이후로 설정 불가능
const checkMaxTime = () => {
  let today = dayjs().format('YYYY-MM-DD')
  if (deptMngField.CHECK_DATE === today) {
    let max = dayjs().$H + ':' + dayjs().$m
    if (deptMngField.CHECK_TIME > max) {
      deptMngField.CHECK_TIME = max
    }
  }
}

defineExpose({
  openPopup,
  openPopup2,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1500"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
    eager
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
      @mousedown="startDragging"
    >
      <span>{{ title }}</span>
    </v-sheet>
    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-3 pb-0">
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnUpdate', 'btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-4 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <IGridTitle :title="$t('작업정보')"></IGridTitle>
            <div class="d-flex mt-2">
              <i-input
                width="200px"
                :label="$t('작업지시번호')"
                top-label
                readonly
                v-model="deptMngField.WORK_ID"
              ></i-input>
              <i-select
                width="200px"
                :label="$t('작업소속')"
                top-label
                readonly
                :items="codeList.CMPNY_DIV"
                item-title="TXT"
                item-value="COD"
                v-model="deptMngField.CMPNY_DIV"
              ></i-select>
              <i-input
                width="200px"
                top-label
                readonly
                v-model="deptMngField.DEPT_NM"
              ></i-input>
              <i-input
                width="200px"
                top-label
                readonly
                v-model="deptMngField.ASGN_NM"
              ></i-input>
              <i-input
                width="200px"
                :label="$t('작업책임자')"
                top-label
                readonly
                v-model="deptMngField.RESP_EMP_NM"
              ></i-input>
            </div>
            <div class="d-flex mt-2">
              <i-input
                width="200px"
                :label="$t('작업일')"
                top-label
                readonly
                v-model="deptMngField.WORK_DATE"
              ></i-input>
              <i-input
                width="200px"
                :label="$t('작업장소')"
                top-label
                readonly
                v-model="deptMngField.AREA_NM"
              ></i-input>
              <i-input
                width="200px"
                :label="$t('상세위치')"
                top-label
                readonly
                v-model="deptMngField.AREA_FULL_NM"
              ></i-input>
            </div>
            <div class="d-flex mt-2">
              <i-input
                width="200px"
                :label="$t('작업명')"
                top-label
                readonly
                v-model="deptMngField.WRK_DIST"
              ></i-input>
              <i-input
                width="200px"
                :label="$t('위험유형')"
                top-label
                readonly
                v-model="deptMngField.DESCRIPTION"
              ></i-input>
              <i-input
                width="200px"
                :label="$t('작업표준')"
                top-label
                readonly
                v-model="deptMngField.WSNAME"
              ></i-input>
            </div>
            <div class="d-flex mt-2">
              <i-input
                width="150px"
                :label="$t('점검일시')"
                top-label
                type="date"
                readonly
                v-model="deptMngField.CHECK_DATE"
                required
              ></i-input>
              <i-input
                width="150px"
                top-label
                type="time"
                v-model="deptMngField.CHECK_TIME"
                @input="checkMaxTime"
              ></i-input>
            </div>
          </v-sheet>
        </div>
        <div class="d-flex">
          <v-sheet width="40%" class="mr-3">
            <IGridTitle :title="$t('점검자 리스트')"> </IGridTitle>
            <RealGrid
              ref="grdMain"
              :fields="grdMainProps.fields"
              style="height: 300px"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCurrentRowChanged="onGrdMainCurrRowChanged"
            />
          </v-sheet>
          <v-sheet width="60%">
            <IGridTitle :title="$t('점검 결과')"> </IGridTitle>
            <RealGrid
              ref="grdSub"
              :fields="grdSubProps.fields"
              style="height: 300px"
              :columns="grdSubProps.columns"
              :column-layout="grdSubProps.columnLayout"
              @onCellClicked="onCellClicked"
              @onCellItemClicked="onCellButtonClicked"
            />
          </v-sheet>
        </div>
      </v-card-text>
    </v-card>
    <IUploadPopup ref="fileUploadPopup"></IUploadPopup>
  </v-dialog>
</template>
<style scoped>
.sheetTitle {
  font-size: 20px;
  font-weight: bold;
}
</style>
