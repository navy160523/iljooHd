<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import dayjs from 'dayjs'
import Message from "@hiway/utils/notify"
import _ from "lodash"

defineOptions({
  name:'10_management-MNG_C-MNGCC0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어

const menuTitle = ref(null)
const grdMain = ref(null)
const tab = ref('안전/보건')

const sysCodeList = reactive({
  HHIZ110: [],
  BSNS_CDList: [],
})

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  ASGN_CD: userStore.asgnCd,
  SONIM_DIV: [],
  HAEIM_YN: 'Y',
  FCTR_DIV: '',
  STRDATE: dayjs(new Date).format('YYYY-MM'),
})

const saveParam = ref(null)

const statusList = ref({
  changes: [
    { title: '총계' , value: 10 },
    { title: '유지' , value: 8 },
    { title: '변경' , value: 2 },
    { title: '신규' , value: 1 },
    { title: '해임' , value: 1 },
  ],
  sonim: [
    { title: '안전관리자', value: '7(7)' },
    { title: '안전보건 관리담당자', value: '2(2)' },
    { title: '보건관리자', value: '3(3)' },
  ],
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar: { visible: true } },
  keys : ['SONIM_DIV', 'FCTR_DIV','EMP_NM'],
  fields : [ 
    { fieldName: 'SONIM_DIV', dataType: 'text', header: { text: t('선임구분'), exportStyleName: 'export_header_style' }, width:'200',lookupDisplay: true, 
      editor: { type: 'dropdown', domainOnly: true, dropDownWhenClick: true }, exportStyleName: 'export_style' },
    { fieldName: 'SONIM_LOC', dataType: 'text', header: { text: t('선임지역'), exportStyleName: 'export_header_style' }, 
      width:'180', exportStyleName: 'export_style', editable: false },
    { fieldName: 'SONIM_JAGYEC', dataType: 'text', header: { text: t('수당지급자격'), exportStyleName: 'export_header_style' }, width:'180',
      exportStyleName: 'export_style' },
    { fieldName: 'BSNS_CD', dataType: 'text', header: { text: t('사업부'), exportStyleName: 'export_header_style' }, 
      width:'200', editable: false, lookupDisplay: true, exportStyleName: 'export_style' },
    { fieldName: 'DEPT_NM', dataType: 'text', header: { text: t('부서'), exportStyleName: 'export_header_style' }, 
      width:'200', editable: false, exportStyleName: 'export_style' },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위'), exportStyleName: 'export_header_style' }, 
      exportStyleName: 'export_style', editable: false },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번'), exportStyleName: 'export_header_style' }, 
      width:'120', editable: false, exportStyleName: 'export_style' },
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('성명'), exportStyleName: 'export_header_style' }, width:'120',
      exportStyleName: 'export_style', editable: false },
    { fieldName: 'SONIM_DATE', dataType: 'text','displayCallback': function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') : null}, 
      width:'120', header: { text: t('수당변경일'), exportStyleName: 'export_header_style' }, editable: false, exportStyleName: 'export_style' },
    { fieldName: 'TOTAL_SUDANG_AMT', dataType: 'number', numberFormat: '#,###', header: { text: t('수당총액(원)'), exportStyleName: 'export_header_style' }, width:'120',
      exportStyleName: 'export_style',styleName: 'right-column', editable: false },
    { fieldName: 'SUDANG_AMT', dataType: 'number', numberFormat: '#,###', header: { text: t('수당금액(원)'), exportStyleName: 'export_header_style' }, width:'120', styleName: 'editable_column',
      editor: { type: 'number' }, exportStyleName: 'export_style',styleName: 'right-column editable_column' },
    { fieldName: 'RESULT', dataType: 'text', header: { text: t('검토결과'), exportStyleName: 'export_header_style' }, 
      exportStyleName: 'export_style', editable: false },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고'), exportStyleName: 'export_header_style' }, 
      styleName: 'left-column editable_column', exportStyleName: 'export_style', width:'250' },

    { fieldName: 'FCTR_DIV', dataType: 'text', header: { text: t('FCTR_DIV') }, visible: false },
    { fieldName: 'DIV_CD', dataType: 'text', header: { text: t('DIV_CD') }, visible: false },
    { fieldName: 'JAGYEC_DIV', dataType: 'text', header: { text: t('JAGYEC_DIV') }, visible: false },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

const initCodeList = () => {
  statusList

  let param = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    ALL_UP_CD: 'HHIZ110',
    USE_FLAG: 'N',
    CODE_NAME_TYPE: '0',
    USE_DIV: 'N',
    CODE_DESC1: tab.value,
  }

  Promise.all([
    commonSearchApi({ queryId : 'searchBSNS', param }),,
  ]).then(res => {
    sysCodeList.BSNS_CDList = res[0].ORESULT_CUR

    grdMain.value.setBindingColumn("BSNS_CD", res[0].ORESULT_CUR, "BSNS_CD", "BSNS_NM")
  })

}

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      // .setGridList([grdMain])
      .setQuery(searchData) 
      .setAfter(afterSearch)
      .run()

  } else if(btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  } else {

    let title = searchParams.STRDATE.split('-')
    let fullTitle = '국가자격등록 수당 현황 (' + title[0].slice(-2) + '년' + title[1] + '월)'

    grdMain.value.getGridView().exportGrid({
      type: 'excel',
      target: 'local',
      lookupDisplay: true,
      fileName: '국가자격등록 수당 현황.xlsx', // 저장될 파일 name
      documentTitle: { //제목
        message: fullTitle,
        visible: true,
        spaceTop: 1,
        spaceBottom: 0,
        height: 50,
        styleName: "excelTitle",
      },
      progressMessage: '엑셀 다운로드중입니다.', // 엑셀 다운로드 하는 동안 progressMessage 표시
      showProgress: true, // 엑셀 다운로드 하는 동안 progressBar 표시
      indicator: 'visible', // indidator 영역 표시
      header: 'visible', // 헤더 표시
      footer: 'hidden', // footer 표시하지 않음
      allColumns: true, // visible : false 인 행도 표시할 것인지 여부
      hideColumns: ['FCTR_DIV' , 'DIV_CD' , 'JAGYEC_DIV'],
      done: () => {
        // 내보내기 완료 후 실행되는 함수
        Message.success(t('엑셀 다운로드가 완료되었습니다.'))
      },
    })
  }
}

const searchData = async () => {
  grdMain.value.getDataProvider().setRows([])
  let test = []
  test.push(searchParams.SONIM_DIV.join(','))
  searchParams.SONIM_DIV = test

  // 변동사항 조회
  commonSearchApi({ queryId : 'MNGCC0020_SEARCH_02', param: searchParams }).then(res => {

    for(let item in res.ORESULT_CUR[0]){
      statusList.value.sonim.forEach(e => {
        if(e.COD == item.substring(1,4) ){
          e.value = res.ORESULT_CUR[0][item] ? res.ORESULT_CUR[0][item] : 0
        }``
      })
    }
    statusList.value.changes[0].value = res.ORESULT_CUR[0].TOTAL
    statusList.value.changes[1].value = res.ORESULT_CUR[0].TOTAL - res.ORESULT_CUR[0].HAEIM - res.ORESULT_CUR[0].NEW
    statusList.value.changes[2].value = res.ORESULT_CUR[0].CHANGE
    statusList.value.changes[3].value = res.ORESULT_CUR[0].NEW
    statusList.value.changes[4].value = res.ORESULT_CUR[0].HAEIM

  })

  // 그리드 조회
  return commonSearchApi({ queryId : 'MNGCC0020_SEARCH_01', param: searchParams })
}

const gridSet = async () => {
  let rowData = await grdMain.value.getDataProvider().getJsonRows()
  let result = rowData

  result.forEach((item, idx) => {
    let tot = null
    result.forEach(item2 => {
      if(item.EMP_NO === item2.EMP_NO){
        tot += item2.SUDANG_AMT ? item2.SUDANG_AMT : null
      }
    })
    tot = tot === 0 ? null : tot
    item.TOTAL_SUDANG_AMT = tot

    
    // grdMain.value.getGridView().setValue(idx , 'TOTAL_SUDANG_AMT', tot)
  })

  grdMain.value.getDataProvider().setRows(result)
}

const onRowUpdated = () => {
  gridSet()
}

const afterSearch = res => {
  let data = res.ORESULT_CUR
  
  grdMain.value.getDataProvider().setRows(data)
  gridSet()
}

const beforeSave = async () => {
  saveParam.value = []

  let result = true
  let chekedRow = await grdMain.value.getGridView().getCheckedRows()

  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))

    result = false
  } else {
    chekedRow.forEach( val => {
      let data = grdMain.value.getDataProvider().getJsonRow(val)
      data.CMPNY_DIV = searchParams.CMPNY_DIV
      data.USER_ID = userStore.userId
      data.SONIM_DATE = data.SONIM_DATE ? dayjs(data.SONIM_DATE).format('YYYYMMDD') : null
      data.HAEIM_DATE = data.HAEIM_DATE ? dayjs(data.HAEIM_DATE).format('YYYYMMDD') : null
      data.DEC_DATE = data.DEC_DATE ? dayjs(data.DEC_DATE).format('YYYYMMDD') : null
      data.NEW_EDU_DATE = data.NEW_EDU_DATE ? dayjs(data.NEW_EDU_DATE).format('YYYYMMDD') : null
      data.RE_EDU_DATE = data.RE_EDU_DATE ? dayjs(data.RE_EDU_DATE).format('YYYYMMDD') : null
      data.EDU_DATE = data.EDU_DATE ? dayjs(data.EDU_DATE).format('YYYYMMDD') : null

      saveParam.value.push(data)
    })
  }

  return result
}

const saveData = () => {
  return commonExecuteApi({ queryId: "MNGCC0020_SAVE_01", list: saveParam.value })
}

const tabChange = e => {
  grdMain.value.getDataProvider().setRows([])
  sysCodeList.HHIZ110 = []
  searchParams.SONIM_DIV = []
  searchParams.STRDATE = dayjs(new Date).format('YYYY-MM')

  let param = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    ALL_UP_CD: 'HHIZ110',
    USE_FLAG: 'N',
    CODE_NAME_TYPE: '0',
    CODE_DESC1: tab.value,
  }

  Promise.all([
    commonSearchApi({ queryId : 'MNGCC0020_SEARCH_03', param: param }),
  ]).then(res => {
    sysCodeList.HHIZ110 = res[0].ORESULT_CUR

    if(tab.value === '안전/보건'){
      statusList.value.sonim = [
        { title: '안전관리자', value: '', COD: '010' },
        { title: '안전보건관리담당자', value: '', COD: '130' },
        { title: '보건관리자', value: '', COD: '020' },
      ]

      searchParams.SONIM_DIV = ['010','130','020']
    }else if(tab.value === '소방'){
      statusList.value.sonim = [
        { title: '소방안전관리자', value: '', COD: '030' },
        { title: '위험물안전관리자', value: '', COD: '050' },
        { title: '소방안전관리보조자', value: '', COD: '040' },
        { title: '공사업면허', value: '', COD: '080' },
        { title: '공사업면허(보조)', value: '', COD: '090' },
      ]

      searchParams.SONIM_DIV = ['030','050','040','080','090']
    }else if(tab.value === '환경'){
      statusList.value.sonim = [
        { title: '대기환경기술인', value: '', COD: '060' },
        { title: '수질환경기술인', value: '', COD: '120' },
        { title: '유해화학물질관리자', value: '', COD: '070' },
        { title: '폐기물기술관리인', value: '', COD: '150' },
      ]

      searchParams.SONIM_DIV = ['060','120','070','150']
    }else {
      statusList.value.sonim = []

      res[0].ORESULT_CUR.forEach(element => {
        searchParams.SONIM_DIV.push(element.COD)
      })
    }

    grdMain.value.setBindingColumn("SONIM_DIV", sysCodeList.HHIZ110, "COD", "TXT")

  }).finally(() => {
    onButtonsClick({ id: 'btnSearch' })
  })

}

const dateChange = async e => {
  let data = e.split('-')
  let year = await data[0].slice(0,4) > dayjs(new Date).format('YYYY') ? dayjs(new Date).format('YYYY') : await data[0].slice(0,4)
  if(data[0].length >= 4) {
    searchParams.STRDATE = await year + '-' + data[1]
  }
}

onMounted(() => { 
  initCodeList()
  tabChange()
  
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        :title="$t(useLogsStore().menuId)"
        ref="menuTitle"
        :button-list="['btnSearch', 'btnUpdate', 'btnExcel']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="mb-2">
          <VTabs v-model="tab" @update:model-value="tabChange">
            <VTab value="안전/보건">안전/보건</VTab>
            <VTab value="소방">소방</VTab>
            <VTab value="환경">환경</VTab>
            <VTab value="자산">자산</VTab>
          </VTabs>
        </v-sheet>
        <v-sheet class="searchArea d-flex">
          <i-input
            :label="$t('날짜')"
            labelWidth="50px"
            width="250px"
            type="month"
            v-model="searchParams.STRDATE"
            @update:model-value="dateChange"
          />
        </v-sheet>
        <v-sheet class="d-flex">
          <div style="width: 35%;">
            <VTable density="comfortable" class="text-center border">
              <tbody>
                <tr>
                  <th class="text-center header">전월 대비 변동사항</th>
                </tr>
              </tbody>
            </VTable>
            <VTable density="comfortable" class="text-center border">
              <tbody>
                <tr>
                  <td 
                    v-for="(item , i) in statusList.changes"
                    :key="i"
                    class="border content"
                  >
                    {{ item.title }}
                  </td>
                </tr>
                <tr>
                  <td 
                    v-for="(item , i) in statusList.changes"
                    :key="i"
                    class="border"
                  >
                    {{ item.value }}
                  </td>
                </tr>
              </tbody>
            </VTable>
          </div>
          <div style="width: 65%;">
            <VTable density="comfortable" class="text-center border">
              <tbody>
                <tr>
                  <th class="text-center header">법정선임자</th>
                </tr>
              </tbody>
            </VTable>
            <VTable density="comfortable" class="text-center border">
              <tbody>
                <tr>
                  <td 
                    v-for="(item , i) in statusList.sonim"
                    :key="i"
                    class="border content"
                    :width="1/3"
                  >
                    {{ item.title }}
                  </td>
                </tr>
                <tr>
                  <td 
                    v-for="(item , i) in statusList.sonim"
                    :key="i"
                    class="border"
                    :width="1/3"
                  >
                    {{ item.value }}
                  </td>
                </tr>
              </tbody>
            </VTable>
          </div>
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onRowUpdated="onRowUpdated"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
::v-deep(.header) {
  background-color: #e8eaf2 !important;
  color: #000;
  font-size: 12pt;
  width: 100%;
  min-width: 100% !important;
}

::v-deep(.content) {
  background-color: #e8eaf2;
  color: #000;
  font-size: 12pt;
}
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>