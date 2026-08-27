<!-- SPPDB0010 위험기계기구 안전검사 / 위험기계 정보 일괄변경 -->
<!-- SI2팀 이민규 2024-04-29 -->

<script setup>
import { ref, reactive, getCurrentInstance, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { useUserStore } from "@hiway/stores/user";
import queryFlowHelper from "@/utils/searchFlowHelper";
import saveFlowHelper from "@/utils/saveFlowHelper";
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from '@hiway/utils/notify'
import {commonExecuteApi, commonExecuteApi2, getCodeList, commonSearchApi} from '@hiway/api/commonApi'
import SPPDA0010AddAdd from '@/pages/50_safety-support/SPP_D/SPPDA0010PopUp2.vue'
import dayjs from "dayjs"

defineOptions({
  name:'50_safety-support-SPP_D-SPPDA0010',
})

const menuTitle = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore =  useUserStore()
const grdMain = ref(null)
const popupTitle = ref('신규검사')
const t = useI18n().t //다국어
const dialog = ref(false);
const AddTargetPopUp = ref(null);
const emit = defineEmits(["reSearch"])
const DataInput = reactive({
  CMPNY_DIV:userStore.cmpnyDiv,
  TEST_ID:'',
  PLAN_DT_FROM:dayjs().format('YYYY-MM-01'),
  PLAN_DT_TO:dayjs().format('YYYY-MM-DD'),
  REMARK:'',
  ATTACH_ID:'',
  USER_ID: userStore.userId,
  STATUS:'10',
})
const inputApply = reactive({
  TEST_DIV:'10',
  TEST_DT:dayjs().format('YYYY-MM-DD'),
  TEST_AGENCY:'A001',
  INSPECTOR:''
})
const chkApply = reactive({
  TEST_DIV:'Y',
  TEST_DT:'Y',
  TEST_AGENCY:'Y',
  INSPECTOR:'N'
})
const codeList =reactive([])

const openPopup = (param) => {
  dialog.value = true

  for(let i in DataInput){
      DataInput[i] = null
    }

  if(Array.isArray(param)){
    popupTitle.value = '신규검사'
    console.log('new_param',param)
    DataInput.STATUS = '10'

    nextTick(() => {
      grdMain.value.getDataProvider().setRows() //초기화
      grdMain.value.getDataProvider().setRows(param)
      grdMain.value.getGridView().checkAll()
    })


  }else{ //계획 수정
    popupTitle.value = '계획수정'

    console.log('param',param)
    DataInput.CMPNY_DIV = param.CMPNY_DIV
    DataInput.TEST_ID = param.TEST_ID
    DataInput.STATUS = param.STATUS
    DataInput.PLAN_DT_FROM = dayjs(param.PLAN_DT_FROM).format('YYYY-MM-DD')
    DataInput.PLAN_DT_TO = dayjs(param.PLAN_DT_TO).format('YYYY-MM-DD')
    DataInput.REMARK = param.REMARK
    DataInput.CHARGE_EMP_NO = param.CHARGE_EMP_NO

    searchGrdData()
  }

  initCodeList()
}

const onButtonsClick = (btn)=>{
  if (btn.id === "btnUpdate") {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid:grdMain, row: 'check' }])
      .setGridList([grdMain])
      .setBefore(validationCheck)
      .setQuery(saveData)
      .setAfter(() => {
        emit('reSearch')
        dialog.value = false
      })
      .run()
  }else if(btn.id ==='btnClose'){
    dialog.value = false
  }else if(btn.id ==='btnAddInspTarget'){
    AddTargetPopUp.value.openPopup(null)
  }else if(btn.id === 'btnRmvInspTarget'){

    let chekedRow = grdMain.value.getGridView().getCheckedRows(true)

    if(popupTitle.value === '신규검사'){
        grdMain.value.getDataProvider().removeRows(chekedRow)
    }else{ //계획 수정일때
      new deleteFlowHelper(vm, t)
        .setBefore(() => {
          let result = true

          if (chekedRow.length === 0) {
            Message.err(t("선택된 데이터가 없습니다."))

            result = false
          }

          return result
        })
        .setQuery(() => {
          let data = []
          chekedRow.forEach((val) => {
            data.push(grdMain.value.getDataProvider().getJsonRow(val))
          })

          return commonExecuteApi({ queryId : 'SPPDA0010_DELETE_02', list: data })
        })
        .setAfter(deletedAfter)
        .run()
    }
  }else if(btn.id === 'btnDelete'){
    new deleteFlowHelper(vm, t)
        .setBefore()
        .setQuery(() => {
          return commonExecuteApi({ queryId : 'SPPDA0010_POPUP_DELETE_01', list: [DataInput] })
        })
        .setAfter(() => {
          dialog.value = false
          emit('reSearch')
        })
        .run()
  }
}

const deletedAfter = async () => {
  searchGrdData()  
}

//일괄적용 클릭
const btnApplyClick = async () =>{
  
  let rowData = await grdMain.value.getDataProvider().getJsonRows()
  let result = rowData

  result.forEach((item, idx) => {

    if(chkApply.TEST_DIV === 'Y') grdMain.value.getGridView().setValue(idx, "TEST_DIV", inputApply.TEST_DIV)
    if(chkApply.TEST_DT === 'Y' && inputApply.TEST_DT) grdMain.value.getGridView().setValue(idx, "TEST_DT", inputApply.TEST_DT)
    if(chkApply.TEST_AGENCY === 'Y') grdMain.value.getGridView().setValue(idx, "TEST_AGENCY", inputApply.TEST_AGENCY)
    if(chkApply.INSPECTOR === 'Y' && inputApply.INSPECTOR) grdMain.value.getGridView().setValue(idx, "INSPECTOR", inputApply.INSPECTOR)
  })
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { checkBar:{visible: true} },
  keys : ['EQUIP_KIND','EQUIP_SEQ'],
  fields : [ 
    { fieldName: 'EQUIP_KIND', dataType: 'text', width: '100', header: { text: t('장비군') }, lookupDisplay:true, editable: false },
    { fieldName: 'MANAGE_DEPT_NM', dataType: 'text', width: '120', header: { text: t('관리부서') }, styleName:'left-column' , editable: false},
    { fieldName: 'CHARGE_EMP_NM', dataType: 'text', width: '120', type: 'data', header: { text: t('관리담당자') } , editable: false},
    { fieldName: 'ITMANAGER_EMPNM', dataType: 'text', width: '120', type: 'data', header: { text: t('사용부서 담당자') }, editable: false },
    { fieldName: 'EQUIP_NO', dataType: 'text', width: '120', type: 'data', header: { text: t('장비번호') }, editable: false },
    { fieldName: 'STATUS', dataType: 'text', width: '120', type: 'data', header: { text: t('장비상태') }, lookupDisplay:true, editable: false  },
    { fieldName: 'TEST_DIV', dataType: 'text', width: '120', type: 'data', header: { text: t('구분') }, lookupDisplay: true , styleName:'editable_column', 
    editor: { type: 'dropdown', dropDownCount: 5, domainOnly: true, partialMatch: true }, required: true, requiredMessage: '[구분]는 필수입니다.' },
    { fieldName: 'TEST_DT', dataType: 'datetime', datetimeFormat: 'yyyy-MM-dd', width: '120', header: { text: t('검사일자') },
      editor: { type: 'date', datetimeFormat: 'yyyy-MM-dd', mask: { editMask: '9999-99-99', placeHolder: 'yyyy-MM-dd', includedFormat: true },}, 
      required: true, requiredMessage: '[검사일자]는 필수입니다.' , styleName:'editable_column', },
    { fieldName: 'TEST_AGENCY', dataType: 'text', width: '100', header: { text: t('검사기관') } , lookupDisplay: true, styleName:'left_column editable_column' , 
      editor: { type: 'dropdown', dropDownCount: 5, domainOnly: true, partialMatch: true } },
    { fieldName: 'INSPECTOR', dataType: 'text', width: '100', header: { text: t('검사원') }, styleName:'editable_column', },
    { fieldName: 'INSTALL_PLACE', dataType: 'text', width: '120', type: 'data', header: { text: t('설치위치') }, styleName:'left-column', editable: false,},
    { fieldName: 'INSTALL_DT', header: { text: t('설치일자') } ,editor: { datetimeFormat: "yyyy-MM-dd" },dataType: "datetime",datetimeFormat: "yyyy-MM-dd", editable: false,},
    { fieldName: 'MAKER', dataType: 'text', width: '120', type: 'data', header: { text: t('제조사') }, styleName:'left-column', editable: false },
    { fieldName: 'USE_DEPT_NM', dataType: 'text', width: '120', type: 'data', header: { text: t('사용부서') }, styleName:'left-column', editable: false }, 
    { fieldName: 'TRMS_NO', dataType: 'text', width: '120', type: 'data', header: { text: t('설비번호(TRMS)') }, editable: false },
    { fieldName: 'REMARK', dataType: 'text', width: '100', header: { text: t('비고') }, styleName:'left-column editable_column'},
    
    { fieldName: 'EQUIP_KIND2', dataType: 'text', width: '100' },
    { fieldName: 'EQUIP_SEQ', dataType: 'text', width: '100',  header: { text: t('장비ID') }, editable:false },
    
    // 출력 안함
    { fieldName: 'CFM_YN', dataType: 'text', header: { text: t('부서확인') } , visible: false},
    { fieldName: 'CMPNY_DIV', dataType: 'text' , visible: false },
    { fieldName: 'TEST_ID', dataType: 'text' , visible: false },
    { fieldName: 'EQUIP_COMPANY', visible:false },
    { fieldName: 'NONTEST_YN', dataType: 'text',header: { text: t('검사제외') }, },
    
  ],
  columns : [],
  columnLayout:[
    'EQUIP_KIND',
    'EQUIP_SEQ',
    'MANAGE_DEPT_NM',
    'CHARGE_EMP_NM',
    'EQUIP_NO',
    'STATUS',
    {
      name: '안전검사/인증',
      direction: 'horizontal',
      items: [
        'TEST_DIV',
        'TEST_DT',                          
        'TEST_AGENCY',                          
        'INSPECTOR',                                              
      ],
      header: {
        text: t('안전검사/인증'),
      },
    },
    'CFM_YN',
    {
      name: '설치사양',
      direction: 'horizontal',
      items: [
        'INSTALL_PLACE',
        'INSTALL_DT',                          
        'MAKER',                          
      ],
      header: {
        text: t('설치사양'),
      },
    },
    'USE_DEPT_NM',
    'TRMS_NO',
    'REMARK',
    'NONTEST_YN'
  ],
})

grdMainProps.columns = grdMainProps.fields

defineExpose({
  openPopup,
});

const searchGrdData = () => {
  new queryFlowHelper(vm, t)      
      .setQuery(searchData)
      .setAfter(afterSearch)
      .showMessage(true)
      .run();
}

const searchData = () => {
  grdMain.value.getDataProvider().setRows(null)
  let search = {}

  if(DataInput.TEST_ID){
   search.CMPNY_DIV = DataInput.CMPNY_DIV
   search.TEST_ID = DataInput.TEST_ID
   search.CHARGE_EMP_NO = DataInput.CHARGE_EMP_NO
  }

  return commonSearchApi({queryId: "SPPDA0010_SEARCH_06", param: search })
}

const afterSearch = (res) => {
  console.log('res', res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 유효성 검사
const validationCheck = async() => {
  let checkedRows = await grdMain.value.getGridView().getCheckedRows()
  let result = true
  
  if(!DataInput.PLAN_DT_FROM || !DataInput.PLAN_DT_TO){
    Message.warn(t('검사계획일은 필수 입력입니다.'))
    return 
  }

  if(checkedRows.length === 0){
    Message.warn(t('선택된 데이터가 없습니다.'))
    return
  }

  await checkedRows.forEach(x => {
    let data = grdMain.value.getDataProvider().getJsonRow(x)

    if(data.NONTEST_YN === 'Y'){
      Message.warn(t(`${data.EQUIP_NO}는 검사제외 대상은 등록할 수 없습니다.`))
      result = false
    }
  })

  return result  
}

const saveData = () => {

  let inputData = {
    CMPNY_DIV:userStore.cmpnyDiv,
    TEST_ID: DataInput.TEST_ID,
    PLAN_DT_FROM:DataInput.PLAN_DT_FROM.replaceAll('-',''),
    PLAN_DT_TO:DataInput.PLAN_DT_TO.replaceAll('-',''),
    REMARK:DataInput.REMARK,
    ATTACH_ID:'',
    STATUS:DataInput.STATUS,
    USER_ID: userStore.userId,
  }

  let result = commonExecuteApi2({ queryId : 'SPPDA0010_POPUP_SAVE_04', list: [inputData] }).then((rs) => {

    let chkRow = grdMain.value.getGridView().getCheckedRows()

    let params = []
    chkRow.forEach(async fe => {
      let row = grdMain.value.getDataProvider().getJsonRow(fe)
      console.log('fe_data',fe)
      console.log('row_data',row)
      
      if(!DataInput.TEST_ID){
         DataInput.TEST_ID = rs.RES_TEST_ID
         //row.TEST_ID = rs.RES_TEST_ID
      }
      
      if(!row.TEST_ID){
        row.TEST_ID = rs.RES_TEST_ID
      }
      
      if(!row.EQUIP_COMPANY) row.EQUIP_COMPANY = row.CMPNY_DIV

      let cTestDt = dayjs(row.TEST_DT).format("YYYYMMDD")
      row.TEST_DT = cTestDt

      params.push(row)
    })

    return commonExecuteApi({ queryId : 'SPPDA0010_POPUP_SAVE_05', list: params })
  })

  return result
}

const initCodeList = () => {
  Promise.all([
    getCodeList('HHIFB130'),
    getCodeList('HHIF816'),
    getCodeList('HHIFB120'),
    getCodeList("HHIF810"), //장비군
    getCodeList("HHIFB110"), //장비상태
  ]).then(res => {
    codeList.TEST_DIV = res[0].ORESULT_CUR
    codeList.TEST_AGENCY = res[1].ORESULT_CUR
    codeList.STATUS = res[2].ORESULT_CUR

    grdMain.value.setBindingColumn("TEST_DIV", res[0].ORESULT_CUR, "COD", "TXT")
    grdMain.value.setBindingColumn("TEST_AGENCY", res[1].ORESULT_CUR, "COD", "TXT")
    grdMain.value.setBindingColumn("EQUIP_KIND",res[3].ORESULT_CUR,"COD","TXT");
    grdMain.value.setBindingColumn("STATUS",res[4].ORESULT_CUR,"COD","TXT");
  })
}

const onConfirm = (e)=> {
  e.forEach(x => {
    let row = x
    row.TEST_ID = DataInput.TEST_ID
    grdMain.value.addRow(row, false)
  })
}

</script>

<template>
  <v-dialog
    v-model="dialog"
    persistent
    width="1200"
    class="draggable-dialog"
    @mousemove="handleDragging"
    @mouseup="stopDragging"
  >
    <div class="title-bar" @mousedown="startDragging">{{ popupTitle }}</div>
    <v-card>
    <v-card-title>
    <IGridTitle
     :use-permission="false"
     :button-list="['btnUpdate', 'btnDelete', 'btnClose']"
     @click-button="onButtonsClick"
    />
    </v-card-title>
    <v-card-text class="pa-0 px-2 content-area">
      <v-sheet class="fill-height">
        <v-card-title class="px-0">검사계획 기본정보</v-card-title>
        <div class="d-flex mb-3 searchArea">
        <i-input
          :label="t('검사ID')"
          width="200px"
          v-model="DataInput.TEST_ID"
          readonly
        />
        <i-select
          :label="$t('진행상태')"
          width="180px"
          margin="10px"
          v-model="DataInput.STATUS"
          :items="codeList.STATUS"
          item-value="COD"
          item-title="TXT"
          readonly
        />
        <i-input
          width="220px"
          :label="$t('검사계획일')"
          v-model="DataInput.PLAN_DT_FROM"
          type="date"
          margin="6px"
          label-width = "67px"
        />
        <i-input
          width="160px"
          :label="$t('-')"
          v-model="DataInput.PLAN_DT_TO"
          type="date"
          margin="10px"
          />
          <i-input
          :label="t('비고')"
          width="320px"
          v-model="DataInput.REMARK"
        />
       </div>
     
        <div class="h-auto">
            <IGridTitle :title="$t('검사대상')" 
              :button-list="['btnAddInspTarget','btnRmvInspTarget']"
              @click-button="onButtonsClick"
              ref="menuTitle"
            />            
            <div class="d-flex mb-3 searchArea justify-space-between">
              <div class="d-flex">
                <div class="mt-2 mr-6">일괄적용 조건</div>
                <v-checkbox v-model="chkApply.TEST_DIV" true-value="Y" false-value="N" /> 
                <i-select
                  v-model="inputApply.TEST_DIV"
                  :label="$t('검사구분')"
                  labelWidth="50px"
                  :items="codeList.TEST_DIV"
                  item-value="COD"
                  width="150px"
                  item-title="TXT"
                />
                <v-checkbox v-model="chkApply.TEST_DT" true-value="Y" false-value="N" />
                <i-input
                  width="200px"
                  :label="$t('검사일자')"
                  labelWidth="50px"
                  v-model="inputApply.TEST_DT"
                  type="date"
                />
                <v-checkbox v-model="chkApply.TEST_AGENCY" true-value="Y" false-value="N" /> 
                <i-select
                  v-model="inputApply.TEST_AGENCY"
                  :label="$t('검사기관')"
                  width="230px"
                  :items="codeList.TEST_AGENCY"
                  item-value="COD"
                  item-title="TXT"
                />
                <v-checkbox v-model="chkApply.INSPECTOR" true-value="Y" false-value="N" />
                <i-input
                  :label="t('검사자')"
                  width="150px"
                  v-model="inputApply.INSPECTOR"
                />
              </div>
              <div>
                <v-btn class="mt-1" @click="btnApplyClick">일괄적용</v-btn>
              </div>  
            </div>
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCellClicked="onSelected"
            />

        </div>
          </v-sheet>
    </v-card-text>
    <SPPDA0010AddAdd @ConfirmPop="onConfirm($event)" ref ='AddTargetPopUp' />
  </v-card>
  </v-dialog>

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
