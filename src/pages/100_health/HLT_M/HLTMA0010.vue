<!-- 
  화면명 : 지역별 온도 현황 등록
  화면개요 : 지역별 온도 현황 등록
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'

defineOptions({
  name:'100_health-HLT_M-HLTMA0010', 
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()

const isAdmin = ref(false)
const menuTitle = ref(null)
const grdMain = ref(null)

// 조회조건
const searchParams = reactive({
  DATE: dayjs().format('YYYY-MM-DD')
})

const codeList = reactive({
  LOCATION: [],
  REST: []
})
/*  공통코드 세팅 */
onMounted(() => {
  // admin 부여
  if(useLogsStore().isMenuAdmin === 'Y' || userStore.authGrpCd.includes('HLTM001')) isAdmin.value = true

  onButtonsClick({ id: 'btnSearch' })
  grdMain.value.getGridView().filterPanel.visible = true
  Promise.all([
    // 측정지역 콤보 바인딩
    getCodeList('HHIZA20A'),
    // 휴게시간 콤보 바인딩
    getCodeList('HHIZA20B'),
  ]).then((res) => {
    codeList.LOCATION = res[0].ORESULT_CUR
    codeList.REST.push({ COD: ' ', TXT: ' ' })
    codeList.REST.push(...res[1].ORESULT_CUR)
    grdMain.value.setBindingColumn('MEASURE_REST', codeList.REST, 'COD', 'TXT')
  })
})

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }},
  keys : [],
  fields : [  

    { fieldName: 'MEASURE_LOC_NM', width: '40', dataType: 'text', editable: false, header: { text: t('측정지역') } },
    { fieldName: 'MEASURE_TEMP', width: '50', dataType: 'number', styleName: 'editable_column right-column', header: { text: t('기온') }, },
    { fieldName: 'MEASURE_REST', width: '150', styleName: 'editable_column left-column', dataType: 'text', header: { text: t('휴게시간') }, editor: { type: 'dropdown' }, lookupDisplay: true, },
    { fieldName: 'USER_NM', width: '50', editable: false, dataType: 'text', header: { text: t('작성자') } },
    { fieldName: 'REMARK', width: '250', styleName: 'editable_column left-column', dataType: 'text', header: { text: t('비고') } },

    // 안보이는거
    { fieldName: 'MEASURE_DT', dataType: 'text', header: { text: t('측정일자') },visible: false, },
    { fieldName: 'MEASURE_LOC', dataType: 'text', header: { text: t('측정장소코드') },visible: false, },
    { fieldName: 'INSERT_USER_ID', dataType: 'text', header: { text: t('INSERT_USER_ID') },visible: false, },
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
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
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
  return commonSearchApi({ queryId: 'HLTMA0010_SEARCH_01', param: { DATE: searchParams.DATE.replaceAll('-','')} })
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
    Message.warn(t('저장할 데이터가 없습니다.'))
    return false
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
  return commonExecuteApi({ queryId : 'HLTMA0010_SAVE_01', list: saveParams })
}

const afterSaveData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
}

// 그리드 데이터 변경 시
const onEditChange = (grid, index, value) => {
  if(index.fieldName == 'MEASURE_TEMP') {
    if(isEmpty(value) || value < 28) {
      grid.setValue(index.itemIndex, 'MEASURE_REST', 'B02')
    } else {
      grid.setValue(index.itemIndex, 'MEASURE_REST', 'B01')
    }
  } 
}

watch(() => searchParams.DATE, (newValue, oldValue) => {
  getData()
})

</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :usePermission="false"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnUpdate']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-input
            v-model="searchParams.DATE"
            :label="$t('일자')"
            label-width="50px"
            type="date"
            width="200px"
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
            @onEditChange="onEditChange" 
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