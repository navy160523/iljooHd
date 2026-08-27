<!--
  화면명 : 위험성평가 위원회 회의록 등록/현황
  화면개요 : 메인 화면
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from 'dayjs'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList, commonSendByEmpNoApi } from '@hiway/api/commonApi'
import Message from "@hiway/utils/notify"
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import FileUpload from '@/pages/20_risk-assessment/RSK_D/Popup/RSKDA0010Popup01.vue'
import MeetingRegister from '@/pages/20_risk-assessment/RSK_D/Popup/RSKDA0010Popup02.vue'
import SelectDept from '@/components/popup/DeptPopup.vue'

defineOptions({
  name:'20_risk-assessment-RSK_D-RSKDA0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const menuTitle = ref(null)
const searchArea = ref(null)
const grdMain = ref(null)

// 팝업
const fileUpload = ref(null)
const meetingRegister= ref(null)
const selectDept = ref(null)

// 조회조건
let searchParams = reactive({    
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  PARTNER_CD: '',
  MEETING_NM: '',
  // 날짜는 YYYYDDMM 형식으로 변경 필요
  //STR_MEETING_DT: dayjs().subtract(1, 'month').format("YYYY-MM-DD"),
  //END_MEETING_DT: dayjs().format("YYYY-MM-DD"),
  YEAR: dayjs().year(),             // 기준년도
  HALF: (dayjs().get("month") + 1) <= 6 ? '1' : '2',
  APPR_STATUS: '',
})

// 코드리스트
const codeList = reactive({
  CMPNY_DIV: [],
  BSNS_CD: [],
  DEPT_CD: [],
  PARTNER_CD: [],
  APPR_STATUS: [
    { COD: '', TXT: '전체' },
    { COD: 'Y', TXT: '결재완료' },
    { COD: 'N', TXT: '결재중' },
    { COD: 'C', TXT: '반려' },
  ],
  /* 반기 */
  harfList: [
    {COD: '1' , TXT: '상반기'},
    {COD: '2' , TXT: '하반기'},
  ]
})

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    // 회사 [0]
    getCompanyList(),
    // 사업부 [1]
    commonSearchApi({ 
      queryId : 'searchBSNS', 
      param : { 
        CMPNY_DIV: userStore.cmpnyDiv, 
        USE_DIV: 'N',
      }, 
    }),
    // 부서[2]
    commonSearchApi({ 
      queryId : 'searchDept3',
      param : {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParams.BSNS_CD,
        USE_DIV:'Y'
      } 
    })
  ]).then(res => {
    codeList.CMPNY_DIV = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.DEPT_CD = res[2].ORESULT_CUR
    codeList.BSNS_CD.unshift({ BSNS_NM:"전체", BSNS_CD:"" })
    codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
  })
}

//그리드1 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true } },
  keys : ['MEETING_ID'],
  fields : [ 
    { fieldName: 'MEETING_ID', dataType: 'text', editable: false, header: { text: t('회의번호') }, width: '100' },
    { fieldName: 'MEETING_NM', 
      dataType: 'text', 
      editable: true, 
      styleName: 'editable_column left-column', 
      header: { text: t('회의명') },
      width: '200' 
    },
    { fieldName: 'MEETING_DATE', dataType: 'text', styleName: 'editable_column', header: { text: t('회의일자') },
      editButtonVisibility: 'always',
      editor: {
        type: 'date', 
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99', 
          placeHolder: 'yyyy-MM-dd', 
          includedFormat: true 
        }
      },
      displayCallback: function(grid, index, value) {
        return value ? dayjs(value).format('YYYY-MM-DD') : null
      },
      width: '80',
    },
    { fieldName: 'MEETING_STIME', dataType: 'text', editable: true, styleName: 'editable_column', header: { text: t('시작시간') }, 
      /* 시(H)는 앞자리 0 ~ 2, 뒷자리 0 ~ 9까지 입력가능, @onGetEditValue 함수를 사용하여 23을 초과할 때 알림발생
       * 분(M)은 앞자리 0 ~ 5, 뒷자리 0 ~ 9까지 입력가능 
       */
      editor: {
        mask: {
          definitions: {
              "b": "[0-2]",
              "c": "[0-9]",
              "d": "[0-5]",
              "e": "[0-9]"
          },
          editMask: "bc:de",
          includedFormat: true,                
          overWrite: true, 
          allowEmpty: true
        }
      },
      "textFormat": "([0-9]{2})([0-9]{2});$1:$2",
      width: '50'
    },
    { fieldName: 'MEETING_ETIME', dataType: 'text', editable: true, styleName: 'editable_column', header: { text: t('종료시간') },
      editor: {
        mask: {
          definitions: {
              "b": "[0-2]",
              "c": "[0-9]",
              "d": "[0-5]",
              "e": "[0-9]"
          },
          editMask: "bc:de",
          includedFormat: true,                
          overWrite: true, 
          allowEmpty: true
        }
      },
      "textFormat": "([0-9]{2})([0-9]{2});$1:$2",
      width: '50'
    },
    { fieldName: 'MEETING_PLACE', dataType: 'text', editable: true, 
      styleName: 'editable_column left-column', 
      header: { text: t('회의장소') }, 
      width: '150',
    },
    { fieldName: 'DEPT_NM', 
      dataType: 'text', editable: false, styleName: 'editable_column left-column', header: { text: t('소속조직') }, 
      button:'action',
      buttonVisibility: 'always', 
      buttonStyle: 'rg-button-renderer-button',
      width: '150'
    },
    { fieldName: 'USER_NM', dataType: 'text', editable: false, header: { text: t('작성자') }, width: '70' },
    { fieldName: 'METTING_CONTENT', 
      dataType: 'text', 
      editable: true, 
      styleName: 'left-column multiline-editor', 
      header: { text: t('회의내용') },
      editor: {
        type: "multiline",
        maxLength: 0, //입력길이제한 x
        height: 150,
        enterKeyBehavior: 'multiline',
      }, 
      width: '250' 
    },
    { fieldName: 'DETAIL', dataType: 'text', editable: false, header: { text: t('상세') },
      styleCallback: function(grid, dataCell) {
        let ret = {}
        const iconSize = 20
        ret.renderer = {
          type: 'icon',
          iconLocation: 'center',
          iconCallback: function(grid, cell) {
            return new URL('/src/assets/images/icons/list-box-outline.png', import.meta.url).href
          },
          iconHeight: iconSize,
          iconWidth: iconSize,
        }
        return ret
      },
      width: '40'
    }, 
    { fieldName: 'FILE_COUNT', dataType: 'text', editable: false, styleName: 'editable_column', width: '100', header: { text: t('파일첨부') },
      button:'action',
      buttonVisibility: 'always', 
      buttonStyle: 'rg-button-renderer-button',
      width: '50'
      // isFile: { value: true, align: 'right', showAlways: true },
      // displayCallback: function (grd, idx, val) {
      //   let data = grdMain.value.getDataProvider().getJsonRow(idx.itemIndex)

      //   return !data.FILE_TITLE ? '' : data.FILE_TITLE + (data.FILE_COUNT > 0 ? ' 외 ' + data.FILE_COUNT + '건' : '')
      // },
    },
    { fieldName: 'APPR_STATUS', dataType: 'text', editable: false, header: { text: t('결재상태') },
      lookupDisplay: true,
      lookupData: { value: "COD", label: "TXT", list: codeList.APPR_STATUS },
      width: '80'
    },

    // 숨기는 필드 visible:'false'
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'BSNS_CD', dataType: 'text', visible: false },
    { fieldName: 'DEPT_CD', dataType: 'text', visible: false },
    { fieldName: 'APPR_DATE', dataType: 'text', visible: false },
    { fieldName: 'USER_ID', dataType: 'text', visible: false },
    { fieldName: 'FILE_TITLE', dataType: 'text', visible: false },
    { fieldName: 'FILE_ID', dataType: 'text', visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

// 버튼 클릭 이벤트
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnCreate') {
    addData()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(validationCheck)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  } else if (btn.id === 'btnDownLoad') {
    if (grdMain.value.getDataProvider().getRows().length === 0) {
      return Message.warn('조회된 데이터가 없습니다.')
    }
    
    grdMain.value.getGridView().exportGrid({
      type: 'excel',
      target: 'local',
      fileName: '위험성평가 위원회 회의록 등록 현황.xlsx',
      progressMessage: '엑셀 다운로드중입니다.', 
      showProgress: true, 
      indicator: 'visible', 
      header: 'visible', 
      footer: 'hidden', 
      allColumns: false,
    })
  }
  
}

// 조회
const searchData = () => {
  return commonSearchApi({ queryId : 'RSKDA0010_SEARCH_01', param: searchParams })
}

// 조회
const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

  // 데이터 길이에 따른 Column 너비 자동 조절
  /*grdMain.value.getGridView().fitLayoutWidth('DETAIL')
  grdMain.value.getGridView().fitLayoutWidth('MEETING_ID')
  grdMain.value.getGridView().fitLayoutWidth('MEETING_NM')
  grdMain.value.getGridView().fitLayoutWidth('MEETING_DATE')
  grdMain.value.getGridView().fitLayoutWidth('MEETING_STIME')
  grdMain.value.getGridView().fitLayoutWidth('MEETING_ETIME')
  grdMain.value.getGridView().fitLayoutWidth('MEETING_PLACE')
  grdMain.value.getGridView().fitLayoutWidth('DEPT_NM')
  grdMain.value.getGridView().fitLayoutWidth('USER_NM')
  grdMain.value.getGridView().fitLayoutWidth('METTING_CONTENT')
  grdMain.value.getGridView().fitLayoutWidth('FILE_ID')
  grdMain.value.getGridView().fitLayoutWidth('APP_STATUS')*/
}

// 새 행 추가
const addData = () => {
  meetingRegister.value.openPopup({ isNew: true })
  // const year = new Date().getFullYear()
  // const month = ('0' + (new Date().getMonth() + 1)).slice(-2)
  // const day = ('0' + (new Date().getDate())).slice(-2)

  // grdMain.value.addRow({
  //   CMPNY_DIV: userStore.cmpnyDiv,
  //   BSNS_CD: userStore.bsnsCd,
  //   DEPT_CD: userStore.deptCd,
  //   MEETING_ID: '',
  //   MEETING_NM: '위험성평가 위원회 검토',
  //   MEETING_DATE: year + '-' + month + '-' + day,
  //   MEETING_PLACE: '',
  //   DEPT_NM: userStore.deptNm,
  //   USER_NM: userStore.userName,
  //   METTING_CONTENT: '',
  //   FILE_ID: '',
  //   APPR_STATUS: '',
  //   MEETING_STIME: '',
  //   MEETING_ETIME: '',
  //   APPR_DATE: '',
  //   USER_ID: userStore.userId,
  // })
}

// 유효성 검사
const validationCheck = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows()

  if(checkedRows.length === 0){
    Message.warn(t('선택된 데이터가 없습니다.'))

    return false
  } else {
    for (let rowIdx of checkedRows) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

      if (!data.MEETING_NM) {
        Message.warn(t('회의명을 입력해주세요.'))
      } else if (!data.MEETING_DATE) {
        Message.warn(t('회의일자를 선택해주세요.'))
      } else if (data.MEETING_STIME > data.MEETING_ETIME) {
        Message.warn(t('시작시간이 종료시간보다 많습니다. 다시 입력해주세요.'))
      } else {
        return true
      }
    }
  }
}

// 저장
const saveData = () => {
  let saveParams = []

  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    data.MEETING_STIME = data.MEETING_STIME.replace(':', '')
    data.MEETING_ETIME = data.MEETING_ETIME.replace(':', '')

    saveParams.push(data)
  }
  
  return commonExecuteApi({ queryId : 'RSKDA0010_SAVE_01', list: saveParams })
}

// 삭제
const deleteData = () => {
  let deleteParams = []

  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    deleteParams.push(data)
  }

  return commonExecuteApi({ queryId : 'RSKDA0010_DELETE_01', list: deleteParams })

}

// 팝업 오픈
// col.field === 0 : 회의록 등록
// col.field === 10 : 파일 선택
const onCellItemClicked = (grid, index, col) => {
  let data = grdMain.value.getDataProvider().getJsonRow(col.dataRow)
  if (col.field === 9) {
    if (!data.MEETING_ID) {
      Message.warn(t('입력한 데이터를 저장해주세요.'))
    } else {
      meetingRegister.value.openPopup(data)
    }
  } 
  // else if (col.field === 10) {

  //   // 파일은 MEETING_ID를 조건으로 저장 및 수정이 가능 
  //   // 신규행은 MEETING_ID가 생성되지 않아 저장 후 파일첨부 요구
  //   if (data.MEETING_ID) {
  //     fileUpload.value.openPopup(data)
  //   } else {
  //     Message.warn(t('입력한 데이터를 저장한 후 파일 첨부가 가능합니다.'))
  //   }
  // }
}

// 파일 선택 후
const onFileSelected = val => {
  if (val) {
    onButtonsClick({ id: 'btnSearch' })
  }
}

// 부서 선택 팝업
const onCellButtonClicked = (grid,index,col) => {
  let popupParam = {
    dataRow: index.dataRow,
    fieldIndex: index.fieldIndex
  }

  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)

  if (index.fieldIndex === 6) {
    selectDept.value.openPopup(popupParam)
  } else if (index.fieldIndex === 10) {

    // 파일은 MEETING_ID를 조건으로 저장 및 수정이 가능 
    // 신규행은 MEETING_ID가 생성되지 않아 저장 후 파일첨부 요구
    if (data.MEETING_ID) {
      fileUpload.value.openPopup(data)
    } else {
      Message.warn(t('입력한 데이터를 저장한 후 파일 첨부가 가능합니다.'))
    }
  }
}

const onDeptSelected = val => {
  // 소속 조직명 변경
  grdMain.value.getDataProvider().setValue(val.dataRow, 'DEPT_NM', val.ASGN_SHRT_NM)
  grdMain.value.getDataProvider().setValue(val.dataRow, 'BSNS_CD', val.BSNS_CD)
  grdMain.value.getDataProvider().setValue(val.dataRow, 'DEPT_CD', val.ASGN_CD)
  // 변경후 checkBar check
  grdMain.value.getGridView().checkRow(val.dataRow)
}

// 사업부 변경 시 부서 변경 이벤트
watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    searchParams.DEPT_CD = ''
  }
  if (newValue !== '') {
    commonSearchApi({ queryId : 'searchDept3',
      param : {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: newValue,
        USE_DIV:'Y'
      } 
    }).then(res => {
      codeList.DEPT_CD = res.ORESULT_CUR
      codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
      if (newValue !== oldValue) {
        // 사업부가 변경 시 "전체" 출력
        searchParams.DEPT_CD = ''
      }
    })
  } else {
    codeList.DEPT_CD = []
    codeList.DEPT_CD.unshift({ DEPT_NM:"전체", DEPT_CD:"" })
  }
})

const onMeetingRegister = async val => {
  // 신규등록후 재조회
  commonSearchApi({
    queryId : 'RSKDA0010_SEARCH_01',
    param: {
      CMPNY_DIV: val.CMPNY_DIV,
      BSNS_CD: val.BSNS_CD,
      DEPT_CD: val.DEPT_CD,
      PARTNER_CD: '',
      MEETING_NM: '',
      YEAR: searchParams.YEAR,             // 기준년도
      HALF: searchParams.HALF,
      // 날짜는 YYYYDDMM 형식으로 변경 필요
      //STR_MEETING_DT: dayjs().subtract(1, 'month').format("YYYY-MM-DD"),
      //END_MEETING_DT: dayjs().format("YYYY-MM-DD"),
    }
  }).then(res => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)

    // 저장한 데이터 포커스 지정
    let lastElement = res.ORESULT_CUR[res.ORESULT_CUR.length - 1]

    grdMain.value.goRow({
      MEETING_ID: lastElement.MEETING_ID
    })
  })
}

// 부서가 바뀌면 협력사 데이터 가져옴
watch(() => searchParams.DEPT_CD, (newValue, oldValue) => {
  if (newValue !== '') {
    commonSearchApi({ 
      queryId : 'searchVend',
      param : {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: searchParams.BSNS_CD,
        DEPT_CD: newValue 
      } 
    }).then(res => {
      codeList.PARTNER_CD = res.ORESULT_CUR
      codeList.PARTNER_CD.unshift({ ASGN_NM:'전체', ASGN_CD:'' })
      if (codeList.PARTNER_CD.length !== 0) {
        searchParams.PARTNER_CD = ''
      }
    })
  } else {
    codeList.PARTNER_CD = []
    codeList.PARTNER_CD.unshift({ ASGN_NM:"전체", ASGN_CD:"" })
    searchParams.PARTNER_CD = ''
  }
})

//  시작시간, 종료시간 입력값 수정
const onGetEditValue = (grid, index, editResult) => {
  if (index.column == 'MEETING_STIME' || index.column == 'MEETING_ETIME' ) {
    let time = editResult.value.substr(0,2)
    if(time > 23) {
      Message.err(t('시간을 다시 입력해주세요.')) 
      editResult.value = ''
    } 
  }
}

onMounted(() => {
  initCodeList()

  searchParams.DEPT_CD = userStore.deptCd // 유저정보의 부서
  codeList.PARTNER_CD.unshift({ ASGN_NM:"선택안함", ASGN_CD:"" })
  searchParams.PARTNER_CD = ''
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea flex-column">
          <div class="d-flex">
            <i-select 
              :label="$t('회사')"
              label-width="60px"
              width="250px"
              v-model="searchParams.CMPNY_DIV"
              :items="codeList.CMPNY_DIV"
              item-value="COD"
              item-title="TXT"
              readonly
            />
            <i-select 
              :label="$t('사업부')"
              label-width="60px"
              width="250px"
              v-model="searchParams.BSNS_CD"
              :items="codeList.BSNS_CD"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
            />
            <i-select 
              :label="$t('부서')"
              label-width="60px"
              width="300px"
              v-model="searchParams.DEPT_CD"
              :items="codeList.DEPT_CD"
              item-value="DEPT_CD"
              item-title="DEPT_NM"
            />
            <i-select 
              :label="$t('협력사')"
              label-width="60px"
              width="300px"
              v-model="searchParams.PARTNER_CD"
              :items="codeList.PARTNER_CD"
              item-value="ASGN_CD"
              item-title="ASGN_NM"
            />
            <i-select 
              :label="$t('진행상태')"
              label-width="60px"
              width="300px"
              v-model="searchParams.APPR_STATUS"
              :items="codeList.APPR_STATUS"
              item-value="COD"
              item-title="TXT"
            />
          </div>
          <div class="d-flex mt-2">
            <i-select 
              :label="$t('기준년도')"
              labelWidth="60px"
              width="250px"
              type="YEAR"
              v-model="searchParams.YEAR"
            />
            <i-select 
              :label="$t('반기')"
              labelWidth="60px"
              width="250px"
              :items="codeList.harfList"
              item-title="TXT"
              item-value="COD"
              v-model="searchParams.HALF"
            />
            <i-input
              :label="$t('검색')"
              label-width="60px"
              width="620px"
              v-model="searchParams.MEETING_NM"
              append-inner-icon="mdi-magnify"
            />
            <!--<i-input
              :label="$t('조회기간')"
              v-model="searchParams.STR_MEETING_DT"
              type="date"
              :items="codeList.YEAR"
              labelWidth="60px" 
              width="300px" 
              margin="10px"
            />
            <i-input
              :label="$t('~')"
              v-model="searchParams.END_MEETING_DT"
              type="date"
              :items="codeList.YEAR"
              width="235px" 
            />-->
          </div>
        </v-sheet>
        <v-sheet class="h-auto">
          <IGridTitle 
            :title="$t('위험성평가 위원회 회의록')"
            :button-list="['btnDownLoad']"
            @click-button="onButtonsClick"
          />
          <RealGrid
            ref="grdMain"
            class="mt-0"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellItemClicked="onCellItemClicked"
            @onCellButtonClicked="onCellButtonClicked"
            @onGetEditValue="onGetEditValue"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <!-- 파일 업로드 -->
  <FileUpload 
    ref="fileUpload"
    @selected="onFileSelected"
  />
  <!-- 회의록 등록 -->
  <MeetingRegister ref="meetingRegister" @selected="onMeetingRegister"/>
  <!-- 부서 선택 -->
  <SelectDept 
    ref="selectDept"
    @selected="onDeptSelected"
  />
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}

</style>
