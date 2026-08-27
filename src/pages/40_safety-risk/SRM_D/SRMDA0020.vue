<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import { commonDownloadFilesApi, commonDeleteAllFilesApi } from "@hiway/api/commonFileApi"
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import IMenuTitle from "@/components/IMenuTitle.vue"
import RealGrid from "@/components/RealGrid.vue"
import dayjs from 'dayjs'
import SRMDA0020Popup01 from '@/pages/40_safety-risk/SRM_D/Popup/SRMDA0020_popup01.vue'

defineOptions({
  name: '40_safety-risk-SRM_D-SRMDA0020',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const userLogStore = useLogsStore()
const t = useI18n().t //다국어
const grdMain = ref(null)
const sRMDA0020Popup01 = ref(null)

const codeList = reactive({
  dateGbnList: [
    { COD: 'A', TXT: '시작일자' },
    { COD: 'B', TXT: '마감일자' },
    { COD: 'C', TXT: '등록일자' }
  ],
  lebelList: [],
  progressList: []
})

const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,
  DEPT_CD: userStore.deptCd,
  GBN: 'C',
  DIFFICULTY: '',
  PROG_PERI_FROM: dayjs(dayjs( ).format('YYYY-MM') + '01').format('YYYY-MM-DD'),
  PROG_PERI_TO: dayjs().format('YYYY-MM-DD'),
  STATUS: '',
  RISK_NM: null
})

const grdMainProps = reactive({
  gridViewOption : {edit: { editable: false }, checkBar: { visible: true }},
  keys : [],
  fields: [
    { fieldName: 'TASK_NO', dataType: 'text', header: {text: t('SOM 관리번호')}},
    { fieldName: 'THUMBNAIL_FILE_ID', dataType: 'text', header: {text: t('썸네일')}, width: '250',
      renderer: {
        width: '250',
        type: 'image',
        imageField: 'THUMBNAIL_FILE_ID',
        imageHeight: 130,
      }
    }, 
    { fieldName: 'RISK_NM', dataType: 'text', header: {text: t('제목')}, width: '200', styleName: 'left-column' },
    { fieldName: 'REG_DT', dataType: 'text', textFormat: '([0-9]{4})([0-9]{2})([0-9]{2});$1-$2-$3', header: {text: t('등록일자')}},
    { fieldName: 'PROG_PERI_FROM', dataType: 'text', textFormat: '([0-9]{4})([0-9]{2})([0-9]{2});$1-$2-$3', header: {text: t('시작일자')}},
    { fieldName: 'PROG_PERI_TO', dataType: 'text', textFormat: '([0-9]{4})([0-9]{2})([0-9]{2});$1-$2-$3', header: {text: t('마감일자')}},
    { fieldName: 'STATUS', dataType: 'text', header: {text: t('진행상태')}, width: '140', lookupDisplay: true,},
    { fieldName: 'DIFFICULTY', dataType: 'text', header: {text: t('난이도')}, width: '60', lookupDisplay: true,},
    { fieldName: 'REWARD', dataType: 'text', header: {text: t('보상')}, width: '80', styleName: 'right-column',
      displayCallback: function (grd, idx, val) {
        if (val) {
          return val.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",") + '원'
        }
      },
    },
    { fieldName: 'TASK_SEQ', dataType: 'text', header: {text: t('리스크 관리번호')}},
    { fieldName: 'SOLT_TITLE', dataType: 'text', header: {text: t('솔루션 접수현황')}, styleName: 'multiline-editor left-column', width: '230'},
    { fieldName: 'SEARCH_CNT', dataType: 'text', header: {text: t('조회수')}, width: '60'},
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const onButtonsClick = btn => {
  if (btn.id === 'btnSearch'){
    new queryFlowHelper(vm, t)
      .setQuery(searchData) 
      .setAfter(afterSearch)
      .run()  
  } else if(btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setBefore(deleteCheck)
      .setQuery(mainDelData)
      .setAfter(afterDelete)
      .run();
  } else if(btn.id === 'btnPrint') {
    let excelFileNM = searchParams.PROG_PERI_FROM + '~' + searchParams.PROG_PERI_TO + ' 안전오픈마켓 관리/현황'
    
    if (grdMain.value.getDataProvider().getRows().length === 0) {
      return Message.warn('조회된 데이터가 없습니다.')
    }

    grdMain.value.getGridView().exportGrid({ 
      type: 'excel',
      target: 'local',
      fileName: excelFileNM,
      progressMessage: '엑셀 다운로드중입니다.', 
      showProgress: true, 
      indicator: 'visible', 
      header: 'visible', 
      footer: 'hidden', 
      allColumns: false,
      lookupDisplay: true,
      exportTemplate: true
    })
  }
}

const searchData = () => {
  let params = {}
  for(let i in searchParams){
    if(i === 'PROG_PERI_FROM' || i === 'PROG_PERI_TO'){
      params[i] = searchParams[i] ? dayjs(searchParams[i]).format('YYYYMMDD') : ''
    }else {
      params[i] = searchParams[i]
    }
  }
  return commonSearchApi({ queryId : 'SRMDA0020_SEARCH_01', param: params })
}

const afterSearch = res => {
  // console.log(' RES : ' , res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  outThumbnail()
}

const deleteCheck = async () => {
  let delCheck = grdMain.value.getGridView().getCheckedRows()

  if(delCheck.length < 1){
    Message.warn("삭제할 데이터를 선택해주세요.")
    return false
  }
  
  return true
}

// 회의 삭제
const mainDelData = async () => {
  let delParams = []
  let delFiles = []
  let delCheck = grdMain.value.getGridView().getCheckedRows()

  // console.log('delCheck',delCheck)

  delCheck.forEach(e => {
    const data = grdMain.value.getRowData(e)
    delParams.push(data)   
    delFiles.push({
      CMPNY_DIV: userStore.cmpnyDiv,
      FILE_ID: data.THUMBNAIL_FILE_ID
    })
  })
  
  // await commonDeleteAllFilesApi(delFiles)
  console.log('삭제 파라미터 ::: ', delParams)
  return commonExecuteApi({
    queryId: "SRMDA0020_DELETE_02",
    list: delParams,
  })
}

const afterDelete = () =>{
  onButtonsClick({id:'btnSearch'})
  outThumbnail()
}

// 썸네일 이미지 출력
const outThumbnail = async val  => {
  let rows = await grdMain.value.getDataProvider().getJsonRows()
  rows.forEach(async (e , idx)=> {
    if(e.THUMBNAIL_FILE_ID){
      let param = {
        CMPNY_DIV: userStore.cmpnyDiv,
        FILE_ID: e.THUMBNAIL_FILE_ID
      }
      await commonSearchApi({ queryId: 'searchFile', param: param }).then(res2 => {
        console.log('outThumbnail log', res2)
        commonDownloadFilesApi(res2.ORESULT_CUR[0]).then(file => {
          const blob = new Blob([file])
          const imageURL = URL.createObjectURL(blob)

          grdMain.value.getDataProvider().setValue(idx, 'THUMBNAIL_FILE_ID', imageURL)
          grdMain.value.getGridView().commit()
        }).catch(err => {
          console.log(err)
        })
      })
    }
  })
}

const onCellClicked = async (grid, clickData) => {
  if(clickData.cellType === 'data' && clickData.column === 'RISK_NM'){
    let rowData = await grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
    sRMDA0020Popup01.value.openPopup({TASK_NO: rowData.TASK_NO})

  }
}

const initCodeList = () => {
  Promise.all([
    getCodeList('HHIJJC03'),
    getCodeList('HHIJJE09')
  ]).then(res => {
    codeList.lebelList = res[0].ORESULT_CUR
    codeList.progressList = res[1].ORESULT_CUR
    codeList.lebelList.unshift({ TXT:'전체', COD: '' })
    codeList.progressList.unshift({ TXT:'전체', COD: '' })

    grdMain.value.setBindingColumn("STATUS", codeList.progressList, "COD", "TXT") // 진행상태
    grdMain.value.setBindingColumn("DIFFICULTY", codeList.lebelList, "COD", "TXT") // 난이도
  })
}

onMounted(() => {
  initCodeList()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch','btnDelete', 'btnPrint']"
        @click-button="onButtonsClick"
      />
    </v-card-title>

    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            width="150px"
            :items="codeList.dateGbnList"
            v-model="searchParams.GBN"
            item-title="TXT"
            item-value="COD"
            class="mr-0"
          />
          <i-input 
            width="150px"
            v-model="searchParams.PROG_PERI_FROM"
            type="date"
            class="mr-0"
          />
          <div class="pa-1 pt-2">
            ~
          </div>
          <i-input
            width="150px"
            v-model="searchParams.PROG_PERI_TO"
            type="date"
          />
          <i-select
            :label="$t('진행상태')"
            labelWidth="50px"
            width="260px"
            :items="codeList.progressList" 
            v-model="searchParams.STATUS"
            item-title="TXT"
            item-value="COD"
          />
          <i-select
            :label="$t('난이도')"
            labelWidth="45px"
            width="150px"
            :items="codeList.lebelList"
            v-model="searchParams.DIFFICULTY"
            item-title="TXT"
            item-value="COD"
          />
          <i-input
            :label="$t('제목')"
            labelWidth="35px"
            width="400px"
            v-model="searchParams.RISK_NM"
            @keydown.enter="onButtonsClick({id: 'btnSearch'})"
          />
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellClicked="onCellClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <SRMDA0020Popup01 ref="sRMDA0020Popup01"/>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>
