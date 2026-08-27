<!-- 
  화면명 : 부서보건담당자지정
  화면개요 : 부서보건담당자지정
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, commonRequest } from '@hiway/api/commonApi'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import dayjs from 'dayjs'
import { getJsonFromExcel } from "@/utils/excel"
import Message from '@hiway/utils/notify'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import EmpPopup from '@/components/popup/EmpPopup.vue'

defineOptions({
  name:'100_health-HLT_F-HLTFA0040', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const isAdmin = ref(false)
const menuTitle = ref(null)
const grdMain = ref(null)
const deptPopup = ref(null)
const empPopup = ref(null)

// 조회조건
const searchParams =reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  YEAR: String(dayjs().get('year')),
  CHY_YEAR: String(Number(dayjs().get('year')) - 1),
  IP_ADDRESS: userStore.clientIp
})

const codeList = reactive({
  YEAR:[],
})

/*  공통코드 세팅 */
onMounted(() => {
  // admin 부여
  if(useLogsStore().isMenuAdmin === 'Y' || 
    userStore.authGrpCd.includes('HLTF001') || 
    userStore.authGrpCd.includes('HIWAYGRP00001') ||
    userStore.authGrpCd.includes('GRP00372')) {
      isAdmin.value = true
  }

  codeList.YEAR = []
  for(var i = dayjs().get('year') + 1; i >= dayjs().get('year')-10; i--) {
    codeList.YEAR.push({COD: String(i), TXT: String(i)})
  }
  onButtonsClick({ id: 'btnSearch' })

  grdMain.value.getGridView().filterPanel.visible = true
})

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: false }},
  keys : ['HEAL_SEQ'],
  fields : [ 
    { fieldName: 'DEPT_NM', width: '150', styleName: 'left-column', dataType: 'text', header: { text: t('부서명') } },
    { fieldName: 'DEPT_CD', width: '100', styleName: 'editable_column', dataType: 'text', header: { text: t('부서코드') },
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          return `
            <div class="d-flex justify-space-between" style="align-items: center;">
              <p style="max-width: 80%; text-align:center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${cell.value ?? ''}</p>
              <i class="mdi mdi-magnify"
                data-index="${cell.index.itemIndex}"
                style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); color: #1a40c7; font-size: 18px; cursor: pointer;">
              </i>
            </div>
          `;
        }
      }
    },
    { fieldName: 'HEAL_NM', width: '100', dataType: 'text', header: { text: t('담당자') } },
    { fieldName: 'HEAL_USER', width: '150', styleName: 'editable_column', dataType: 'text', header: { text: t('사번') },
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          return `
            <div class="d-flex justify-space-between" style="align-items: center;">
              <p style="max-width: 80%; text-align:center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${cell.value ?? ''}</p>
              <i class="mdi mdi-magnify"
                data-index="${cell.index.itemIndex}"
                style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); color: #1a40c7; font-size: 18px; cursor: pointer;">
              </i>
            </div>
          `;
        }
      }
    },

    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'YEAR', dataType: 'text', header: { text: t('년도') },visible: false, },
    { fieldName: 'HEAL_SEQ', dataType: 'text', header: { text: t('순번') },visible: false, },
    { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

//그리드 데이터 입력

// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  if(!isAdmin.value) {
    Message.warn(t('관리자만 사용가능합니다.'))
    return
  }

  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnCreate') {
    grdMain.value.getGridView().filterPanel.clearInput()
    grdMain.value.addRow({
      CMPNY_DIV: userStore.cmpnyDiv,
      YEAR: searchParams.YEAR,
      DEPT_NM: '',
      DEPT_CD: '',
      HEAL_NM: '',
      HEAL_USER: ''
    }, false)
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnCopy') {
    
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else if (btn.id === 'btnFormDownload') {
    let params = {
      FILE_PATH: 'HLTF',
      FILE_NAME: '부서보건담당자지정 샘플.xlsx',
    }
    commonSampleDownFilesApi(params)
  } else if (btn.id === 'btnExcelUpload') {
    const input = document.createElement('input')

    input.type = 'file'
    input.onchange = function(event) {
      const selectedFile = event.target.files[0]

      // 선택된 파일에 대한 처리
      getJsonFromExcel(selectedFile, excelUploadCallback)
    }
    input.click()
  }
}
const getData = () => {
  if(!isAdmin.value) {
    Message.warn(t('관리자만 사용가능합니다.'))
    return
  }

  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

//  조회
const searchData = () => {
  return commonSearchApi({ queryId: 'HLTFA0040_SEARCH_01', param: searchParams })
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
    if(isEmpty(data.DEPT_CD)) {
      return Message.warn(t('부서코드는 필수입력입니다.')) 
    } else if (isEmpty(data.HEAL_USER)) {
      return Message.warn(t('사번은 필수입력입니다.'))
    }
  }
  return true
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.IP_ADDRESS = userStore.clientIp
    saveParams.push(data)
  }
  // return commonExecuteApi({ queryId : 'HLTFA0040_SAVE_01', list: saveParams })
  return commonRequest("/hse/health/HLTFA0040_SAVE_01", { queryId: "HLTFA0040_SAVE_01", list: saveParams })
}

const afterSaveData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
}

const deleteData = async () => { 
  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    if(data.SAVE_YN != 'Y') {
      continue
    }
    data.IP_ADDRESS = userStore.clientIp
    saveParams.push(data) 
  }
  
  // return commonExecuteApi({ queryId : 'HLTFA0040_DELETE_01', list: saveParams })
  return commonRequest("/hse/health/HLTFA0040_DELETE_01", { queryId: "HLTFA0040_DELETE_01", list: saveParams })
}

const afterDelete = () => {
  getData()
  Message.success(t('성공적으로 삭제되었습니다'))
}

//엑셀 업로드 이벤트
const excelUploadCallback = (excelData) => {  
  let saveParams = []
  excelData.map(item => {
    let data = {
      DEPT_CD: item.부서코드,
      HEAL_USER: item['담당자 사번'],
      YEAR: searchParams.YEAR,
      CMPNY_DIV: searchParams.CMPNY_DIV,
      USE_YN: 'Y'
    }
    if (!isEmpty(data.DEPT_CD) && !isEmpty(data.HEAL_USER)) {
      saveParams.push(data)
    }
  })
 
  commonRequest("/hse/health/HLTFA0040_SAVE_01", { queryId: "HLTFA0040_SAVE_01", list: saveParams }).then(res => {
    Message.success(t('성공적으로 저장되었습니다'))
    getData()
  })
}

// 돋보기 클릭
const onCellItemClicked = (grid, index, col) => {
  // 돋보기가 아니라 그냥 셀클릭 시 return
  if(!col.target.className.includes('mdi')) {
    return
  }
  if(index.fieldName == 'DEPT_CD') {
    deptPopup.value.openPopup()
  } else if (index.fieldName == 'HEAL_USER') {
    empPopup.value.openPopup({})
  }
}

// 부서 선택
const onDeptSelected = val => {
  grdMain.value.getDataProvider().setValue(grdMain.value.getGridView().getCurrent().dataRow, 'DEPT_CD', val.ASGN_CD)
  grdMain.value.getDataProvider().setValue(grdMain.value.getGridView().getCurrent().dataRow, 'DEPT_NM', val.ASGN_SHRT_NM)
  grdMain.value.getGridView().checkRow(grdMain.value.getGridView().getCurrent().dataRow, true, false, false)
}

// 인원 선택
const onEmpSelected = val => {
  grdMain.value.getDataProvider().setValue(grdMain.value.getGridView().getCurrent().dataRow, 'DEPT_CD', val.DEPT_CD)
  grdMain.value.getDataProvider().setValue(grdMain.value.getGridView().getCurrent().dataRow, 'DEPT_NM', val.DEPT_NM)
  grdMain.value.getDataProvider().setValue(grdMain.value.getGridView().getCurrent().dataRow, 'HEAL_USER', val.EMP_NO)
  grdMain.value.getDataProvider().setValue(grdMain.value.getGridView().getCurrent().dataRow, 'HEAL_NM', val.EMP_NM)
  grdMain.value.getGridView().checkRow(grdMain.value.getGridView().getCurrent().dataRow, true, false, false)
}

const copy = () => {
  vm.$swal({
    title: t('기존에 있던 부서보건담당자를 삭제하고 가지고 옵니다.\n결과를 가지고 오시겠습니까?'),
    showCancelButton: true,
  }).then((ck) => {
    if (ck.isConfirmed === true) {
      // commonExecuteApi({ queryId : 'HLTFA0040_SAVE_02', list: [searchParams] }).then(res => {
      commonRequest("/hse/health/HLTFA0040_SAVE_02", { queryId: "HLTFA0040_SAVE_02", list: [searchParams] }).then(res => {
        Message.success(t('성공적으로 저장되었습니다.'))
        getData()
      })
    }
  })
}

watch(() => searchParams.YEAR, (newValue, oldValue) => {
  // getData()
  grdMain.value.getDataProvider().setRows([])
})

</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete', 'btnCopy', 'btnFormDownload', 'btnExcelUpload']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex justify-space-between">
          <div>
            <i-select
              v-model="searchParams.YEAR"
              :label="$t('해당년도')"
              label-width="50px"
              :items="codeList.YEAR"
              item-value="COD"
              item-title="TXT" 
              width="200px"
            />
          </div>
          <div class="d-flex">
            <i-select
              v-model="searchParams.CHY_YEAR"
              :label="$t('대상년도')"
              label-width="50px"
              :items="codeList.YEAR"
              item-value="COD"
              item-title="TXT" 
              width="200px"
            />
            <v-btn
              
              color="primary"        
              @click="copy"
            >
            가져오기
            </v-btn>
          </div>
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            @onCellItemClicked="onCellItemClicked"
          />
        </v-sheet>
      </div>
      <DeptPopup ref="deptPopup" @selected="onDeptSelected"/>
      <EmpPopup ref="empPopup" @selected="onEmpSelected"/>
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