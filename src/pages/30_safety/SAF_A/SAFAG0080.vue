<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from 'vue-i18n'
import Message from '@hiway/utils/notify'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import dayjs from 'dayjs'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import SAFAG0080Popup from '../SAF_A/SAFAG0080Popup.vue'
import { useUserStore } from '@/@hiway/stores/user'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import { getJsonFromExcel } from "@/utils/excel"
import { commonLogExecuteApi } from "@hiway/api/commonApi"
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'

defineOptions({
  name:'30_safety-SAF-A_SAFAG0080',
})

 
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const searchArea = ref(null)
const menuTitle = ref(null)
const userStore = useUserStore() //유저정보
const grdMain = ref(null)
const safag0080Popup = ref(null)
const empPopup = ref(null)


const searchParams =  reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  STT_DT: dayjs().subtract(1, 'month').format("YYYY-MM-DD"),
  END_DT: dayjs().format("YYYY-MM-DD"),
  STATUS: '',
  PATIENT_NM: '',
})

const codeList =  reactive({
  CMPNY_DIV: [],
  BSNS_CD: [],
  DEPT_CD: [],
  STATUS: [],
})


const empPopupOpen =()=>{
  searchParams.EMP_NM = searchParams.PATIENT_NM 
  empPopup.value.openPopup(
    {EMP_NM:searchParams.PATIENT_NM,
    DISABLE:["전체","사내협력사","단기공사","기타"]
    }
      )
}

 const selected =(row)=>{

      if(row){
        searchParams.PATIENT_NM = row.EMP_NM
        searchParams.EMPLO = row.EMP_NO
      }

    } 


    watch(() => searchParams.PATIENT_NM, newValue => {
    if(newValue === ''){
      searchParams.EMPLO  = ''
    }

  })

//코드리스트 셋팅
const initCodeList = () => {

  Promise.all([
    getCodeList('HHIZ000'), //0
    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "N" },
    }), //1
    commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: null, USE_DIV:'Y' } }), // 부서
    getCodeList('HHIB250110'), //3 
    getCodeList('HHIB250060'), //4

  ]).then(res => {


    codeList.CMPNY_DIV = res[0].ORESULT_CUR.filter(x => x.COD === '100' || x.COD === 'HHI' )
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.DEPT_CD = res[2].ORESULT_CUR
    codeList.STATUS = res[3].ORESULT_CUR
    codeList.STATUS.unshift({COD:'' , TXT:'전체'})

    grdMain.value.setBindingColumn("BSNS_CD", res[1].ORESULT_CUR, "BSNS_CD", "BSNS_NM")
    grdMain.value.setBindingColumn("DEPT_CD", res[2].ORESULT_CUR, "DEPT_CD", "DEPT_NM")
    grdMain.value.setBindingColumn("STATUS", res[3].ORESULT_CUR, "COD", "TXT") 
    grdMain.value.setBindingColumn("SAN_STATUS", res[4].ORESULT_CUR, "COD", "TXT") 

    
  })
}

//그리드1 속성셋팅
const grdProps1 = reactive({
  gridViewOption : { checkBar: { visible: true } },
  keys : ['CMPNY_DIV','PATIENT_NO','PATIENT_NM','CHARGE_MONTH'],
  fields : [ 
    { fieldName: 'STATUS',  dataType: 'text', header: { text: t('상태') }, lookupDisplay: true,
      editable: false,
    },


    { fieldName: 'CHARGE_MONTH',header: { text: t('청구월') },dataType:'text','displayCallback':function(grid, index, value){return value ? dayjs(value).format('YYYY-MM') :null},
     editor: { type:'date', datetimeFormat:'yyyy-MM', mask: { editMask: '9999-99-99', placeHolder:'yyyy-MM', includedFormat:true} }, styleName: 'editable_column'  },

    { fieldName: 'PAY_DT',header: { text: t('납부월') },dataType:'text','displayCallback':function(grid, index, value){return value ? dayjs(value).format('YYYY-MM') :null},
     editor: { type:'date', datetimeFormat:'yyyy-MM', mask: { editMask: '9999-99', placeHolder:'yyyy-MM', includedFormat:true} }, styleName: 'editable_column'  },

    { fieldName: 'PATIENT_NO',  dataType: 'text', header: { text: t('환자번호') }, editable: false },
    { fieldName: 'BSNS_CD',  dataType: 'text', header: { text: t('사업부') }, lookupDisplay: true, editable: false },
    { fieldName: 'DEPT_CD',  dataType: 'text', header: { text: t('부서') }, lookupDisplay: true, editable: false,  styleName: "left-column", },
    { fieldName: 'EMPLNO',  dataType: 'text', header: { text: t('사번') }, editable: false },
    { fieldName: 'PATIENT_NM',  dataType: 'text', header: { text: t('성명') }, editable: false },
    { fieldName: 'BIRTH_DAY',  dataType: 'datetime',  datetimeFormat: 'yyyy-MM-dd', header: { text: t('생년월일'),editor: { datetimeFormat: 'yyyy-MM-dd' } }, editable: false },
    { fieldName: 'ILLNESS_STT_DT', dataType: 'datetime',  datetimeFormat: 'yyyy-MM-dd', header: { text: t('발병일자'),editor: { datetimeFormat: 'yyyy-MM-dd' } }, editable: false },
    { fieldName: 'CHARGE_AMOUNT', dataType:'number', header: { text: t('청구금액') },numberFormat:"#,###" , groupFooter: {numberFormat: "#,###",expression: "sum"},styleName: 'editable_column' },
    { fieldName: 'FILENUM', dataType: 'text', header: { text: t('파일번호') }, editable: false,
      button:"action", buttonVisibility: "always", buttonStyle: "rg-button-renderer-button",
    },
    { fieldName: 'SAN_STATUS', dataType: 'text', header: { text: t('산재상태') }, editable: false , lookupDisplay: true },
    { fieldName: 'OCCURDATE', dataType: 'datetime',  datetimeFormat: 'yyyy-MM-dd', header: { text: t('재해일자'),editor: { datetimeFormat: 'yyyy-MM-dd' } } , editable: false},

    { fieldName: 'REQ_REFUND_DT',header: { text: t('환급 요청일') },dataType:'text','displayCallback':function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') :null},
     editor: { type:'date', datetimeFormat:'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder:'yyyy-MM-dd', includedFormat:true} }, styleName: 'editable_column'  },


    { fieldName: 'TELNO1', dataType: 'text', header: { text: t('연락처') }, editable: false },

   { fieldName: 'REFUND_DT',header: { text: t('공단 환급일') },dataType:'text','displayCallback':function(grid, index, value){return value ? dayjs(value).format('YYYY-MM-DD') :null},
     editor: { type:'date', datetimeFormat:'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder:'yyyy-MM-dd', includedFormat:true} }, styleName: 'editable_column'  },


     { fieldName: 'REFUND_AMOUNT', dataType:'number', header: { text: t('환급금') },numberFormat:"#,###" ,styleName: 'editable_column'},

    { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고') },styleName: 'editable_column' },
    
    { fieldName: 'SANNO', dataType: 'text',  visible: false ,    },

    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false  },

  ],
  columns : [],
})


grdProps1.columns = grdProps1.fields

const onButtonsClick = btn => {

  if(btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setSearchArea(searchArea)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .showMessage(false)
      .run()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setBefore(validationCheck)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: null }])
      .setGridList([grdMain])
      .setQuery(deleteData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
  }

  else if (btn.id === 'btnExcelUpload') {
    //html 에 display:none input 추가
    
    const input = document.createElement('input')
    
    input.type = 'file'
    input.onchange = function(event) {
      const selectedFile = event.target.files[0]
      // 선택된 파일에 대한 처리
      getJsonFromExcel(selectedFile, excelUploadCallback)
    }
    input.click()
    
  }
  else if(btn.id === 'btnSampleDown'){
    let params = {
      FILE_PATH: 'DB',
      FILE_NAME: '울산대학병원_파일.xlsx',  
    }
    commonSampleDownFilesApi(params)
  }
}

// 엑셀업로드
const excelUploadCallback = excelData => {

  var mappedData = excelData.map(item => {

    return {
      // 그리드 필드명  : 엑셀파일 해더
      CMPNY_DIV:searchParams.CMPNY_DIV,
      CHARGE_MONTH: item.청구년월,
      PATIENT_NM: item.성명,
      PATIENT_NO: item.환자번호,
      ILLNESS_STT_DT:item.발병일자,
      CHARGE_AMOUNT: item.금액,
      STATUS : '10'
    }
  })

  const uniqueData = Array.from(new Set(mappedData.map(item => item.PATIENT_NO))).map(patientNo => {
    return mappedData.find(item => item.PATIENT_NO === patientNo)
  })


  grdMain.value.getDataProvider().fillJsonData(uniqueData)
  grdMain.value.getGridView().setAllCheck(true)
}

const selectedSafag0080 = data =>{

  

  let current = grdMain.value.getGridView().getCurrent()
  let dataRow = current.dataRow

  
  grdMain.value.getDataProvider().setValue(dataRow, 'FILENUM', data.FILENUM)
  grdMain.value.getDataProvider().setValue(dataRow, 'BSNS_CD', data.BSNS_CD)
  grdMain.value.getDataProvider().setValue(dataRow, 'EMPLNO', data.EMPLNO)
  grdMain.value.getDataProvider().setValue(dataRow, 'OCCURDATE', data.OCCURDATE)
  grdMain.value.getDataProvider().setValue(dataRow, 'SAN_STATUS', data.STATUS)
  grdMain.value.getDataProvider().setValue(dataRow, 'TELNO1', data.TELNO1)
  grdMain.value.getDataProvider().setValue(dataRow, 'DEPT_CD', data.DEPT_CD)
  grdMain.value.getDataProvider().setValue(dataRow, 'BIRTH_DAY', dayjs(data.BIRTH_DAY).format('YYYY-MM-DD'))
  grdMain.value.getDataProvider().setValue(dataRow, 'SANNO', data.SANNO)
  grdMain.value.getGridView().checkRow(dataRow)
}


const searchData = () => {
  return commonSearchApi({ queryId : 'SAFAG0080_search01', param: searchParams })
}

const afterSearch = res => {





  let params = [] 
  for(let i of res.ORESULT_CUR){

    i.BIRTH_DAY = i.BIRTH_DAY ? dayjs(i.BIRTH_DAY).$d : ''
    i.CHARGE_MONTH = i.CHARGE_MONTH ? dayjs(i.CHARGE_MONTH).$d : ''
    i.ILLNESS_STT_DT = i.ILLNESS_STT_DT ? dayjs(i.ILLNESS_STT_DT).$d : ''
    i.OCCURDATE = i.OCCURDATE ? dayjs(i.OCCURDATE).$d : ''
    i.PAY_DT = i.PAY_DT ? dayjs(i.PAY_DT).$d : ''
    i.REFUND_DT = i.REFUND_DT ? dayjs(i.REFUND_DT).$d : ''
    i.REQ_REFUND_DT = i.REQ_REFUND_DT ? dayjs(i.REQ_REFUND_DT).$d : ''
    
    params.push(i)
  }
  

  grdMain.value.getGridView().columnByName("REQ_REFUND_DT").editable
  grdMain.value.getDataProvider().setRows(params)





  let afterparams={
      userStore:userStore,
      params:searchParam,
      mgs:"울산대학교병원 후불진료비 현황 개인 정보 관련 을 조회했습니다.",
      crudGbn:"R",//행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
      logDesc:"",// 사유입력
      menuId:useLogsStore().menuId,
      menuNm:t(useLogsStore().menuId),
  }

      commonLogExecuteApi(afterparams)


     
}

const validationCheck = () => {
  let checkedRows = grdMain.value.getGridView().getCheckedRows()

  if(checkedRows.length === 0){
    Message.warn(t('선택된 데이터가 없습니다.'))

    return false
  } else {
    return true
  }
}

//메뉴버튼 - 저장
const saveData = () => {



  let saveParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    data.BIRTH_DAY = data.BIRTH_DAY ? dayjs(data.BIRTH_DAY).format('YYYYMMDD') : '',
    data.CHARGE_MONTH = data.CHARGE_MONTH ? dayjs(data.CHARGE_MONTH).format('YYYYMM') :'',
    data.ILLNESS_STT_DT =  data.ILLNESS_STT_DT ? dayjs(data.ILLNESS_STT_DT).format('YYYYMMDD') :'',
    data.OCCURDATE =  data.OCCURDATE ? dayjs(data.OCCURDATE).format('YYYYMMDD'): '',
    data.PAY_DT =  data.PAY_DT ? dayjs(data.PAY_DT).format('YYYYMMDD'): '',
    data.REFUND_DT =  data.REFUND_DT ? dayjs(data.REFUND_DT).format('YYYYMMDD') :'',
    data.REQ_REFUND_DT =  data.REQ_REFUND_DT ? dayjs(data.REQ_REFUND_DT).format('YYYYMMDD'):''
   
    
    saveParams.push(data)
  }

  return commonExecuteApi({ queryId : 'SAFAG0080_save01', list: saveParams })
          .then(()=>{
            let afterparams={
                userStore:userStore,
                params:saveParams,
                mgs:"울산대학교병원 후불진료비 현황 개인 정보 관련 을 저장했습니다.",
                crudGbn:"U",//행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
                logDesc:"",// 사유입력
                menuId:useLogsStore().menuId,
                menuNm:t(useLogsStore().menuId),
            }

                commonLogExecuteApi(afterparams)
          })

  

  
}

//메뉴버튼 - 삭제
const deleteData = () => {



  let delParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)

  // 추가버튼 클릭으로 생긴 셀 삭제
  let rowNum = grdMain.value.getGridView().getCheckedRows(true)
  for (let i in rowNum) {
    grdMain.value.getDataProvider().removeRow(rowNum[i])
    for (let rowIdx of checkedRows) {
      let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
      data.BIRTH_DAY = data.BIRTH_DAY ? dayjs(data.BIRTH_DAY).format('YYYYMMDD') : '',
      data.CHARGE_MONTH = data.CHARGE_MONTH ? dayjs(data.CHARGE_MONTH).format('YYYYMM') :'',
      data.ILLNESS_STT_DT =  data.ILLNESS_STT_DT ? dayjs(data.ILLNESS_STT_DT).format('YYYYMMDD') :'',
      data.OCCURDATE =  data.OCCURDATE ? dayjs(data.OCCURDATE).format('YYYYMMDD'): '',
      data.PAY_DT =  data.PAY_DT ? dayjs(data.PAY_DT).format('YYYYMMDD'): '',
      data.REFUND_DT =  data.REFUND_DT ? dayjs(data.REFUND_DT).format('YYYYMMDD') :'',
      data.REQ_REFUND_DT =  data.REQ_REFUND_DT ? dayjs(data.REQ_REFUND_DT).format('YYYYMMDD'):''
      delParams.push(data)
    }

    return commonExecuteApi({ queryId : 'SAFAG0080_delete01', list: delParams })
            .then(()=>{
                    let afterparams={
                        userStore:userStore,
                        params:delParams,
                        mgs:"울산대학교병원 후불진료비 현황 개인 정보 관련 을 삭제했습니다.",
                        crudGbn:"D",//행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
                        logDesc:"",// 사유입력
                        menuId:useLogsStore().menuId,
                        menuNm:t(useLogsStore().menuId),
                    }

                        commonLogExecuteApi(afterparams)
                  })

  }
}

const openPopup = data => {
  safag0080Popup.value.openPopup(data)
}

const onCellButtonClicked  = (grid, index, col) => {
  let data = grdMain.value.getDataProvider().getJsonRow(index.dataRow)

  openPopup(data)
}



onMounted(() => {
  grdMain.value.getGridView().groupPanel.visible = true 
  grdMain.value.getGridView().groupBy(["CHARGE_MONTH"])
  grdMain.value.getGridView().rowGroup.indentVisible = false
  grdMain.value.getGridView().rowGroup.expandedAdornments = "footer"
  
  initCodeList()
})
</script>

<template>
  <div class="page-wrap">
    <VContainer
      class="pt-5 contentPanel"
    >      
      <VRow>
        <VCol>
          <IMenuTitle
            ref="menuTitle"
            :title="$t(useLogsStore().menuId)"
            :button-list="['btnSearch', 'btnUpdate', 'btnDelete','btnExcelUpload','btnSampleDown']"
            @click-button="onButtonsClick"
          />
        </VCol>
      </VRow>
      <!-- 조회조건 -->
      <VRow>
        <VCol>
          <VForm
            ref="searchArea"
            class="searchArea"
          >                
            <VRow>  
              <VCol cols="12" md="2">
                <ILabel
                  :label="$t('회사')"
                >
                  <template #editor="editorProps">
                    <VAutocomplete 
                      v-model="searchParams.CMPNY_DIV"
                      :items="codeList.CMPNY_DIV"
                      item-value="COD"
                      item-title="TXT"
                      
                    />
                  </template>       
                </ILabel>
              </VCol>              
              <VCol cols="4">  
                <ILabel
                  :label="$t('발병일자')"
                >
                  <template #editor="editorProps">
                    <VTextField
                      v-model="searchParams.STT_DT"
                      type="date"
                    />
                    &nbsp;~&nbsp;
                    <VTextField
                      v-model="searchParams.END_DT"
                      type="date"
                    />
                  </template>      
                </ILabel>
              </VCol>
              <VCol cols="12" md="2">
                <ILabel
                  :label="$t('상태')"
                  
                >
                  <template #editor="editorProps">
                    <VAutocomplete 
                      v-model="searchParams.STATUS"
                      :items="codeList.STATUS"
                      item-value="COD"
                      item-title="TXT"
                    />
                  </template>      
                </ILabel>
              </VCol>            
              <VCol cols="12" md="3">
                <ILabel
                  :label="$t('산재자')"
        
                >
                  <template #editor="editorProps">
                    <v-row>
                      <v-col>
                        <VTextField 
                        v-model="searchParams.PATIENT_NM"
                        append-inner-icon="mdi-magnify" 
                        @click:appendInner="empPopupOpen"
                        @keypress.enter ="empPopupOpen"
                        />
                      </v-col>
                      
                      <v-col>
                        <VTextField 
                        readonly
                        v-model="searchParams.EMPLO"
                        />
                      </v-col>

                    </v-row>
                  </template>      
                </ILabel>
              </VCol>                                                                      
            </VRow>
          </VForm>
        </VCol>
      </VRow>
      <VRow>
        <VCol cols="12" md="12">
          <RealGrid
            ref="grdMain"
            class="mt-2"
            style="height: calc(100vh - 410px);"
            :grid-view-option="grdProps1.gridViewOption"
            :keys="grdProps1.keys" 
            :fields="grdProps1.fields"
            :columns="grdProps1.columns"
            @onCellButtonClicked="onCellButtonClicked"
          />
        </VCol>
      </VRow>       
    </VContainer>
    <SAFAG0080Popup 
      ref="safag0080Popup"
      @selected="selectedSafag0080"
    />
    <EmpPopup ref="empPopup" @selected ="selected" />
  </div>
</template>

<style scoped>
rg-button-renderer-button {
  background: mdi-account;
}
</style>
  
