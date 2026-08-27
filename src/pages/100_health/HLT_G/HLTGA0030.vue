<!-- 
  화면명 : 건강진단 하반기 특검 관리
  화면개요 : 하반기 특검 관리
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import _ from 'lodash'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonLogExecuteApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import { getJsonFromExcel } from '@/utils/excel'
import Message from '@hiway/utils/notify'

defineOptions({
  name:'100_health-HLT_G-HLTGA0030', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const isAdmin = ref(false)
const menuTitle = ref(null)
const grdMain = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: String(dayjs().get('year')),
  HALF_DIV: 'LO',
  STANDARD_YEAR: `${String(dayjs().get('year'))} 상반기 정기`
})

const codeList = reactive({
  YEAR: [],
  HALF_DIV: [],
})

/*  공통코드 세팅 */
onMounted(() => {
  // admin 부여
  // if(useLogsStore().isMenuAdmin === 'Y' || 
  //   userStore.authGrpCd.includes('HLTF001') || 
  //   userStore.authGrpCd.includes('GRP00372')) {
  //     isAdmin.value = true
  // }
  codeList.YEAR = []
  for(var i = dayjs().get('year') + 1; i >= dayjs().get('year')-10; i--) {
    codeList.YEAR.push({COD: String(i), TXT: String(i)})
  }
  Promise.all([
    // 상하반기
    getCodeList('HHII800')
  ]).then((res) => {
    codeList.HALF_DIV = res[0].ORESULT_CUR
  })
  onButtonsClick({ id: 'btnSearch' })
  grdMain.value.getGridView().filterPanel.visible = true
})

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }},
  keys : [],
  fields : [ 
    { fieldName: 'DEPT_CD', width: '60', dataType: 'text', editable: false, header: { text: t('부서코드') },},
    { fieldName: 'DEPT_NM', width: '120', dataType: 'text',  editable: false, styleName:'left-column', header: { text: t('부서명') } },
    { fieldName: 'PROCESS_CD', width: '60', editable: false, dataType: 'text', header: { text: t('공정코드') } },
    { fieldName: 'PROCESS_NM', width: '80', editable: false, styleName: 'left-column', dataType: 'text', header: { text: t('공정명') } },
    { fieldName: 'HARM_CD', width: '60', editable: false, dataType: 'text', header: { text: t('유해인자코드') } },
    { fieldName: 'HARM_NM', width: '80', dataType: 'text', editable: false, styleName: 'left-column', header: { text: t('유해인자명') } },
    { fieldName: 'DUTY_CD', width: '60', dataType: 'text', styleName: 'editable_column', header: { text: t('직무코드') } },
    { fieldName: 'DUTY_NM', width: '100', dataType: 'text', editable: false, header: { text: t('직무명') } },
    
    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') },visible: false, },
    { fieldName: 'HALF_DIV', dataType: 'text', header: { text: t('반기구분') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],    
  columns : [],
})

grd1Props.columns = grd1Props.fields

//그리드 데이터 입력

// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  // if(!isAdmin.value) {
  //   Message.warn(t('관리자만 사용가능합니다.'))
  //   return
  // }

  if (btn.id === 'btnSearch') {
    getData(true)
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnFormDownload') {
    // for(let i = 0; i < grdMain.value.getDataProvider().getJsonRows().length; i++) {
    //   let data = grdMain.value.getDataProvider().getJsonRow(i)
    //   if(!isEmpty(data.DEPT_CD) && !isEmpty(data.PROCESS_CD) && !isEmpty(data.HARM_CD)) {
    //     grdMain.value.getGridView().checkRow(i, true, false, false)
    //   }
    // }

    // 엑셀 다운로드
    grdMain.value.getGridView().exportGrid({
      type: 'excel',
      target: 'local',
      lookupDisplay: true,
      fileName: searchParams.YEAR
        + '년도_하반기_정기_작업환경측정_초과목록' + '.xlsx', // 저장될 파일 name
      progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
      // showProgress: true, // 엑셀 다운로드 하는 동안 progressBar 표시
      indicator: 'visible', // indidator 영역 표시
      header: 'visible', // 헤더 표시 
      footer: 'visible', // footer 표시하지 않음
      allColumns: false, // visible : false 인 행도 표시할 것인지 여부
      // onlyCheckedItems: true,
      hideColumns: ['DUTY_NM'],
      done: () => {
        // 내보내기 완료 후 실행되는 함수
        Message.success(t('엑셀 다운로드가 완료되었습니다.'))
      },
    }) 
  } else if (btn.id === 'btnExcelUpload') {
    vm.$swal({ title: t('측정 초과 공정별 직무 정보 엑셀 업로드 하시겠습니까?\n 부서코드, 공정코드, 유해인자코드가 없는 목록은 저장되지 않습니다.'), showCancelButton: true }).then(res => {
      if (res.isConfirmed) {
        const input = document.createElement('input')

        input.type = 'file'
        input.onchange = function(event) {
          const selectedFile = event.target.files[0]

          // 선택된 파일에 대한 처리
          getJsonFromExcel(selectedFile, excelUploadCallback)
        }
        input.click()
      }
    })
  }
}

//엑셀 업로드 이벤트
const excelUploadCallback = excelData => {  
  let saveList = []
  excelData.map(item => {
    if(isEmpty(item.부서코드) || isEmpty(item.공정코드) || isEmpty(item.유해인자코드)) return
    saveList.push({
      CMPNY_DIV: searchParams.CMPNY_DIV,
      YEAR: searchParams.YEAR,
      HALF_DIV: searchParams.HALF_DIV,
      DEPT_CD: item.부서코드,
      PROCESS_CD: item.공정코드,
      HARM_CD: item.유해인자코드,
      DUTY_CD: item.직무코드
    })
  })

  if(saveList.length == 0) return
  commonExecuteApi({ queryId : 'HLTGA0030_SAVE_01', list: saveList }).then(res => {
    getData(false)
    Message.success(t(`측정 초과 공정별 직무 정보 ${excelData.length}건 중 ${res.list.filter(item => item.OUT_RES_COD == '0').length} 건 저장 완료`))
  })
}

const getData = (showMsg) => {
  // if(!isAdmin.value) {
  //   Message.warn(t('관리자만 사용가능합니다.'))
  //   return
  // }

  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(showMsg)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTGA0030_SEARCH_01', param: searchParams })
}

// 조회 후
const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 저장 전
const beforeSave = () => {
  // check 항목이 없을 시 return
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // validation 체크
  if(checkedRows.length == 0) {
    return Message.warn(t('저장할 데이터가 없습니다.'))
  }

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(isEmpty(data.CMPNY_DIV)) {
      return Message.warn(t('사업부코드는 필수 입력입니다.'))
    } else if (isEmpty(data.YEAR)) {
      return Message.warn(t('년도는 필수 입력입니다.'))
    } else if (isEmpty(data.HALF_DIV)) {
      return Message.warn(t('반기 구분은 필수 입력입니다.'))
    } else if (isEmpty(data.PROCESS_CD)) {
      return Message.warn(t('공정코드는 필수 입력입니다.'))
    } else if (isEmpty(data.HARM_CD)) {
      return Message.warn(t('유해인자코드는 필수 입력입니다.'))
    }
  }
  return true
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)    
    saveParams.push(data)
  }
  return commonExecuteApi({ queryId : 'HLTGA0030_SAVE_01', list: saveParams })
}

const afterSaveData = () => {
  getData(false)
  Message.success(t('성공적으로 저장되었습니다'))
}

watch(() => searchParams.YEAR, (newValue, oldValue) => {
  searchParams.STANDARD_YEAR = `${newValue} 상반기 정기`
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnFormDownload', 'btnExcelUpload','btnSearch', 'btnUpdate' ]"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex justify-space-between">
          <i-select
            v-model="searchParams.YEAR"
            :label="$t('해당년도')"
            label-width="50px"
            :items="codeList.YEAR"
            item-value="COD"
            item-title="TXT" 
            width="200px"
          />
          <i-input
            v-model="searchParams.STANDARD_YEAR"
            :label="$t('측정결과 기준')"
            label-width="80px"
            type="text"
            width="250px"
            :readonly="true"
          />
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            :column-layout="grd1Props.columnLayout"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
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
    min-height: 400px;
  }
}
</style>