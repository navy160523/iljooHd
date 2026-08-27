<!-- SPPHD0020 부서별 사전점검 결과 관리 -->
<!-- SI2팀 마환구 2025-02-20 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { isEmpty } from '@/@core/utils'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList, commonRequest2 } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import Message from '@hiway/utils/notify'
import IGridTitle from '@/components/IGridTitle.vue'
import SPPHD0010Popup from '@/pages/50_safety-support/SPP_H/SPPHD0010Popup.vue'
import IUploadPopup from '@/components/popup/IUploadPopup.vue'
import { useCommonStore } from '@hiway/stores/common'
import dayjs from 'dayjs';



defineOptions({
  name: '50_safety-support-SPP_H-SPPHD0020',
})

const FIUploadPopup =ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const commonStore = useCommonStore()

const menuTitle = ref(null)
const grdMainProps1 = ref(null)
const grdTitle = ref(null)
const isAdmin=ref(false)

//팝업
const spphd0010Popup = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: '',
  BSNS_CD: '',
  DEPT_CD: '',
  ASGN_CD: '',
  TEAM_CD: '',
  TYPN_YEAR : '',
  TYPN_SERNO : ''
})

const codeList = reactive({})

//점검일자, 점검자 일괄입력을 위한 필드추가
const itemField = reactive({
  CHK_DATE: "",
  CHK_USER: "",
});

/*  공통코드 세팅 */
onMounted ( async () => {


  if(useLogsStore().isMenuAdmin === 'Y' ||['SPPH001', 'GRP00392'].some(code => userStore.authGrpCd.includes(code)))
  { 
    isAdmin.value = true  
  }

  await initCodeList();
  await menuTitle.value.setBtnProperty('btnSheetInfoCopy', 'visible', false);

  grdMainProps1.value.getGridView().filterPanel.visible = true
  onButtonsClick({ id: 'btnSearch' })
})

const initCodeList = async () => {
  // console.log(userStore)
  searchParams.CMPNY_DIV = userStore.cmpnyDiv
  
  // searchParams.BSNS_CD = userStore.bsnsCd =='' ? codeList.bsns[0].CODE : userStore.bsnsCd;
  // console.log("BSNS_CD :",searchParams.BSNS_CD)
  // console.log("DEPT_CD :",userStore.deptCd)
  // searchParams.DEPT_CD = userStore.deptCd

  let param = {
    CMPNY_DIV : userStore.cmpnyDiv
    }
  await commonSearchApi({ queryId: 'SPPHD0020_COMBO_01', param: param })
    .then(res => {
        codeList.TYPN_YEAR = res.ORESULT_CUR
        if(codeList.TYPN_YEAR.length>0)
        {
          searchParams.TYPN_YEAR=codeList.TYPN_YEAR[0].CODE
        }
      }
  )
  // console.log("TYPN_YEAR :",searchParams.TYPN_YEAR)
  await commonSearchApi({ queryId: 'SPPHD0020_COMBO_02', param: {
    CMPNY_DIV : userStore.cmpnyDiv,
    YYYY : searchParams.TYPN_YEAR
  } })
    .then(res => {
        // console.log("res:",res)
        codeList.TYPN = res.ORESULT_CUR
        if(codeList.TYPN.length>0)
        { 
          // console.log("TYPN:",codeList.TYPN[0].CODE)
          searchParams.TYPN_SERNO=codeList.TYPN[0].CODE
        }
      }
  )

  await commonSearchApi({ queryId: 'SPPHD0020_COMBO_03', param: {} })
    .then(res => {
        codeList.company = res.ORESULT_CUR
      }
  )

  await commonSearchApi({ queryId: 'SPPHD0020_COMBO_04', param: param })
    .then(res => {
        codeList.bsns = res.ORESULT_CUR
        if(codeList.bsns.length>0)
        {
          searchParams.BSNS_CD = userStore.bsnsCd =='' ? codeList.bsns[0].CODE : userStore.bsnsCd;
        }
      }
  )

  // await commonSearchApi({ queryId: 'SPPHD0020_COMBO_04', param: param })
  //   .then(res => {
  //       codeList.bsns = res.ORESULT_CUR
  //       if(codeList.bsns.length>0)
  //       {
  //         searchParams.BSNS_CD = userStore.bsnsCd =='' ? codeList.bsns[0].CODE : userStore.bsnsCd;
  //       }
  //     }
  // )

  await commonSearchApi({ queryId: 'SPPHD0020_COMBO_05', param: {
    CMPNY_DIV : param.CMPNY_DIV,
    BSNS_CD : searchParams.BSNS_CD 
  } })
    .then(res => {
        // console.log("res:",res)
        codeList.dept = res.ORESULT_CUR
        if(codeList.dept.length > 0)
        {
          
          codeList.dept.unshift({CODE:'', DISPLAY_TEXT:"전체"})  
          searchParams.DEPT_CD = userStore.deptCd == '' ? codeList.dept[0].CODE : userStore.deptCd;
          // searchParams.DEPT_CD = '';
        }
      }
  )

    //인원
  await commonSearchApi({ queryId: 'SPPHD0020_COMBO_08', param: {
    DEPT_CD : searchParams.DEPT_CD 
  } })
    .then(res => {
        codeList.EMP=res.ORESULT_CUR;
        if(codeList.EMP.length>0)
        {
          codeList.EMP.unshift({CODE:"", DISPLAY_TEXT:""})
          grdMainProps1.value.setBindingColumn('CHK_USER', codeList.EMP, 'CODE', 'DISPLAY_TEXT')
        }
      }
  )

  //관련부서
  await commonSearchApi({ queryId: 'SPPHD0020_COMBO_09', param: {
    CMPNY_DIV : searchParams.CMPNY_DIV,
    BSNS_CD : searchParams.BSNS_CD 
  } })
    .then(res => {
        // console.log("BSNS_CD:",searchParams.BSNS_CD );
        codeList.DETP2=res.ORESULT_CUR;
        if(codeList.DETP2.length>0)
        {
          codeList.DETP2.unshift({CODE:"", DISPLAY_TEXT:""})
          grdMainProps1.value.setBindingColumn('REF_DEPT', codeList.DETP2, 'CODE', 'DISPLAY_TEXT')
        }
      }
  )

  itemField.CHK_DATE=dayjs().format("YYYY-MM-DD");
  itemField.CHK_USER=userStore.userId;

  viweChange()
}

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption : { checkBar: { visible: true }, edit: { editable: true }},
  keys : [],
  fields : [ 
    //보이는 것들
    { name:'CHK_FACT', fieldName: 'CHK_FACT', dataType: 'text', header: { text: t('공장') }, editable:true,visible:false, styleName: 'editable_column',},
    { fieldName: 'REF_DEPT_NM', header: {text: t('부서명')}, dataType: 'text', visible:true, editable:false, width:'200'},
    { fieldName: 'CHK_GUBN', dataType: 'text', header: { text: t('구분') }, editable:true, styleName: 'editable_column', },
    { fieldName: 'CHK_ITEM', dataType: 'text', 
    header: { text: t('점검항목') }, 
    editable:true, 
    styleName: 'left-column editable_column',
    width:'400'},
    { fieldName: 'CHK_DATE', dataType: 'text', header: { text: t('점검일자') }, editable:true, styleName: 'center-column editable_column'
      ,editor: {
        type: 'date',
        datetimeFormat: 'yyyy-MM-dd',
        mask: {
          editMask: '9999-99-99',
          placeHolder: 'yyyy-MM-dd',
          includedFormat: true,
        },
      }
      , datetimeFormat: 'yyyy-MM-dd'  },
    { fieldName: 'CHK_USER', dataType: 'text', header: { text: t('점검자') }, editable:true, styleName: 'editable_column', lookupDisplay: true
      , editor: { type: 'dropdown', textReadOnly: false, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true } },
    { name:'PASS', fieldName: 'PASS', dataType: 'text', header: { text: t('양호') }, editable:true, styleName: 'center-column editable_column'
      , editable: false, renderer: { type: 'check', trueValues: 'true', falseValues: 'false' } },
    { name:'ACT', fieldName: 'ACT', dataType: 'text', header: { text: t('현장\n즉조치') }, editable:true, styleName: 'center-column editable_column'
      , editable: false, renderer: { type: 'check', trueValues: 'true', falseValues: 'false' } },
    { name:'URGENT', fieldName: 'URGENT', dataType: 'text', header: { text: t('긴급\n조치필요') }, editable:true, styleName: 'center-column editable_column'
      , editable: false, renderer: { type: 'check', trueValues: 'true', falseValues: 'false' } },
    { name:'URGENCY_DESC', fieldName: 'URGENCY_DESC', dataType: 'text', header: { text: t('긴급조치 필요사항') }, 
    editable:true,
    styleName: 'left-column editable_column',
    width:'400'
   },
    { fieldName: 'REF_DEPT', dataType: 'text', header: { text: t('관련부서') }, editable:true, styleName: 'editable_column', lookupDisplay: true
      , editor: { type: 'dropdown', textReadOnly: false, dropDownCount: 5, partialMatch: true, domainOnly: true, dropDownWhenClick: true } },
    { fieldName: 'IMAGE_YN', dataType: 'text', header: { text: t('사진/자료 첨부') },      
       styleCallback: function(grid, dataCell) {
        let ret = {}
        const iconSize = 20
        
        if (dataCell.value=="N") {
          ret.renderer = {
            type: 'icon',
            iconLocation: 'center',
            iconCallback: function(grid, cell) {
              return new URL('/src/assets/images/icons/paperclip.png', import.meta.url).href
            },
            iconHeight: iconSize,
            iconWidth: iconSize,
          }
        }
        else if(dataCell.value=="Y" && dataCell.value!="")
        {
          ret.renderer = {
            type: 'icon',
            iconLocation: 'center',
            iconCallback: function(grid, cell) {
              return new URL('/src/assets/images/icons/image-search-outline.png', import.meta.url).href
            },
            iconHeight: iconSize,
            iconWidth: iconSize,
          }
        }
        else if(dataCell.value=="")
        {
          
        }
        return ret;
      }, styleName: 'editable_column'},
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('비고') }, editable:true, styleName: 'left_column editable_column' },
    { fieldName: 'SRT', dataType: 'text', header: { text: t('정렬순서') }, editable:true, styleName: 'editable_column' },
    //숨겨진 것들
    { fieldName: 'TYPN_SERNO', dataType: 'text', visible:false},
    { fieldName: 'SEQNO', dataType: 'text', visible:false},
    { fieldName: 'SHEET_NO', dataType: 'text', visible:false},
    { fieldName: 'DEPT_CD', dataType: 'text', visible:false},
    { fieldName: 'ASGN_CD', dataType: 'text', visible:false},
    // { fieldName: 'REF_DEPT_NM', dataType: 'text', visible:false},
    { fieldName: 'ATTACH_ID', dataType: 'text', visible:false},
    { fieldName: 'CHK_USER_NM', dataType: 'text', visible:false},
    { fieldName: 'DEPT_NM', dataType: 'text', visible:false},
    { fieldName: 'ASGN_NM', dataType: 'text', visible:false},
    { fieldName: 'BSNS_CD', dataType: 'text', visible:false},
    { fieldName: 'SAVE_YN', dataType: 'text', visible:false},
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible:false},
  ],
  columns : [],
})

grd1Props.columns = grd1Props.fields

//그리드 데이터 입력

// 조회 버튼
//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    getData()
  } else if (btn.id === 'btnCreate') {
    addData();

  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setTargetGridRow([{ grid: grdMainProps1, row: 'check' }])
      .setGridList([grdMainProps1])
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSaveData)
      .run()
  } else if (btn.id === 'btnDelete') {
    new deleteFlowHelper(vm, t)
      .setConfirmMessage('삭제 하시겠습니까?')
      .setTargetGridRow([{ grid: grdMainProps1, row: 'check' }])
      .setGridList([grdMainProps1])
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  } else if (btn.id === 'btnSheetInfoCopy') { 
    spphd0010Popup.value.openPopup(searchParams)
  }
  else if(btn.id=='btnPreChkResPrint')
  {
    preChkResultPrt();
  }
  else if(btn.id=='btnExcelDown')
  {
    excelDown();
  }
}

const addData=()=>{

  if(!searchParams.DEPT_CD)
  { 
    return Message.warn(t('부서는 필수입니다.'))
  }

  grdMainProps1.value.addRow({
    CHK_GUBN      : "",
    CHK_ITEM      : "",
    CHK_DATE      : "",
    CHK_USER      : "",
    PASS          : "false",
    ACT           : "false",
    URGENT        : "false",
    URGENCY_DESC  : "",
    REF_DEPT      : "",
    REMARK        : "",
    SRT           : "",
    CHK_FACT      : "",
    TYPN_SERNO    : searchParams.TYPN_SERNO,
    SEQNO         : "",
    SHEET_NO      : "",
    DEPT_CD       : searchParams.DEPT_CD,
    ASGN_CD       : searchParams.ASGN_CD,
    ATTACH_ID     : "",
    BSNS_CD       : searchParams.BSNS_CD,
    SAVE_YN       : "N",
    CMPNY_DIV     : searchParams.CMPNY_DIV,
    IMAGE_YN      : "",
    }, false)
}


const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMainProps1])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run()
}

const afterSearch = (res) => {
  grdMainProps1.value.getDataProvider().setRows(res.ORESULT_CUR);
  if(res.ORESULT_CUR.length==0)
  {
    menuTitle.value.setBtnProperty('btnSheetInfoCopy', 'visible', true)
    return Message.warn(t('해당 조직의 점검시트가 없습니다. 시트 작성 후 다시 조회하세요')) 
  }
  else
  {
    menuTitle.value.setBtnProperty('btnSheetInfoCopy', 'visible', false)
  }
}

//  조회
const searchData = () => {
  // console.log(searchParams)
  return commonSearchApi({ queryId: 'SPPHD0020_SEARCH_01', param: {
    TYPN_SERNO : searchParams.TYPN_SERNO,
    CMPNY_DIV : searchParams.CMPNY_DIV,
    BSNS_CD : searchParams.BSNS_CD,
    DEPT_CD : searchParams.DEPT_CD,
    ASGN_CD : searchParams.TEAM_CD=='' ? searchParams.ASGN_CD : searchParams.TEAM_CD
  } })
}

// 저장 전
const beforeSave = () => {
  // check 항목이 없을 시 return
  let checkedRows = grdMainProps1.value.getGridView().getCheckedRows(true)

  // validation 체크
  if(checkedRows.length == 0) {
    Message.warn(t('저장할 데이터가 없습니다.'))
    return false
  }

  for (let rowIdx of checkedRows) {
    let data = grdMainProps1.value.getDataProvider().getJsonRow(rowIdx)
    if (isEmpty(data.CHK_GUBN)) {
      return Message.warn(t('구분은 필수 입력입니다.'))
    } else if (isEmpty(data.CHK_ITEM)) {
      return Message.warn(t('점검항목은 필수 입력입니다.'))
    } 
    // else if (searchParams.BSNS_CD == 'AK00' && isEmpty(data.CHK_FACT)) {
    //   return Message.warn(t('공장은 필수 입력입니다.')) 
    // }
  }
  if(!searchParams.DEPT_CD)
  {
    return Message.warn(t('부서는 필수입니다.'))
  }

  return true
}

const saveData = () => {
  let saveParams = []
  let checkedRows = grdMainProps1.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMainProps1.value.getDataProvider().getJsonRow(rowIdx)
    data.CHK_DATE=data.CHK_DATE.replace(/-/g,"")
    data.ACT=data.ACT == "true" ? 'Y' : 'N'
    data.PASS=data.PASS == "true" ? 'Y' : 'N'
    data.URGENT=data.URGENT == "true" ? 'Y' : 'N'
    if(!data.CMPNY_DIV)
    {
      data.CMPNY_DIV=userStore.cmpnyDiv
    }
    saveParams.push(data)
  }
  // console.log("saveParams",saveParams)

  return commonExecuteApi({ queryId: 'SPPHD0020_SAVE_01', list: saveParams })
    .then(res => { 
      // console.log(res)
    })
}

const afterSaveData = () => {
  getData()
  Message.success(t('성공적으로 저장되었습니다'))
  // initCodeList()
  onButtonsClick({ id: "btnSearch" })
}

const deleteData = async () => { 
  let saveParams = []
  let checkedRows = grdMainProps1.value.getGridView().getCheckedRows(true)

  for (let rowIdx of checkedRows) {
    let data = grdMainProps1.value.getDataProvider().getJsonRow(rowIdx)
    // console.log("SAVE_YN :",data.SAVE_YN)
    if(data.SAVE_YN != 'Y') {
      continue
    }
    data.CMPNY_DIV=userStore.cmpnyDiv
    saveParams.push(data) 
  }
  //  console.log("delete :",saveParams)
  
  return commonExecuteApi({ queryId : 'SPPHD0020_DELETE_01', list: saveParams })
}

const afterDelete = () => {
  getData()
  Message.success(t('성공적으로 삭제되었습니다'))
  // initCodeList()
}

// 팝업
const upData = () => {
  // console.log("upData")
  onButtonsClick({ id: "btnSearch" })
}

function onBsnsChanged(newValue){
  searchParams.BSNS_CD=newValue

  commonSearchApi({ queryId: 'SPPHD0020_COMBO_05', param: {
    CMPNY_DIV : searchParams.CMPNY_DIV,
    BSNS_CD : searchParams.BSNS_CD 
  } })
    .then(res => {
        codeList.dept = res.ORESULT_CUR
        if(codeList.dept.length>0)
        {
        codeList.dept.unshift({CODE:"", DISPLAY_TEXT:"전체"})
        searchParams.DEPT_CD=""
        onDeptChanged(searchParams.DEPT_CD)
        }
        else
        {
          searchParams.DEPT_CD=""
          onDeptChanged(searchParams.DEPT_CD)
        }
      }
  )

  commonSearchApi({ queryId: 'SPPHD0020_COMBO_09', param: {
    CMPNY_DIV : searchParams.CMPNY_DIV,
    BSNS_CD : searchParams.BSNS_CD 
  } })
    .then(res => {
        codeList.DETP2=res.ORESULT_CUR;
        if(codeList.DETP2.length>0)
        {
          codeList.DETP2.unshift({CODE:"", DISPLAY_TEXT:""})
          grdMainProps1.value.setBindingColumn('REF_DEPT', codeList.DETP2, 'CODE', 'DISPLAY_TEXT')
        }
      }
  )

  viweChange()
  
 
}

function viweChange()
{
  if(searchParams.BSNS_CD=="AK00")
  {
    grdMainProps1.value.getGridView().setColumnProperty("CHK_FACT", "visible", true)
    grdMainProps1.value.getGridView().setColumnProperty("ACT", "visible", false)
    grdMainProps1.value.getGridView().setColumnProperty("URGENT", "visible", false)
    grdMainProps1.value.getGridView().setColumnProperty("URGENCY_DESC", "visible", false)
  }
  else
  {
    grdMainProps1.value.getGridView().setColumnProperty("CHK_FACT", "visible", false)
    grdMainProps1.value.getGridView().setColumnProperty("ACT", "visible", true)
    grdMainProps1.value.getGridView().setColumnProperty("URGENT", "visible", true)
    grdMainProps1.value.getGridView().setColumnProperty("URGENCY_DESC", "visible", true)
  }

  if(searchParams.BSNS_CD=="AC00")
  {
    menuTitle.value.setBtnProperty('btnPreChkResPrint', 'visible', true)
  }
  else
  {
    menuTitle.value.setBtnProperty('btnPreChkResPrint', 'visible', false)
  }
}

function onDeptChanged(newValue){
  searchParams.DEPT_CD=newValue
  
  commonSearchApi({ queryId: 'SPPHD0020_COMBO_06', param: {
    CMPNY_DIV : searchParams.CMPNY_DIV,
    BSNS_CD : searchParams.BSNS_CD,
    DEPT_CD : searchParams.DEPT_CD 
  } })
    .then(res => {
        codeList.asgn = res.ORESULT_CUR
        if(codeList.asgn.length>0)
        {
          codeList.asgn.unshift({CODE:'', DISPLAY_TEXT:"전체"})  
          searchParams.ASGN=''
          onAsgnChanged(searchParams.ASGN)
        }
        else
        {
          codeList.asgn.unshift({CODE:'', DISPLAY_TEXT:"전체"})  
          searchParams.ASGN=''
          onAsgnChanged(searchParams.ASGN)
        }
        
      }
  )
  //인원
  commonSearchApi({ queryId: 'SPPHD0020_COMBO_08', param: {
    DEPT_CD : searchParams.DEPT_CD 
  } })
    .then(res => {
        // console.log("DEPT_CD:",searchParams.DEPT_CD)
        codeList.EMP=res.ORESULT_CUR;
        // console.log("EMP:",codeList.EMP)
        if(codeList.EMP.length>0)
        {
          codeList.EMP.unshift({CODE:"", DISPLAY_TEXT:""})
          grdMainProps1.value.setBindingColumn('CHK_USER', codeList.EMP, 'CODE', 'DISPLAY_TEXT')
          itemField.CHK_USER=""
        }
        else
        {
          codeList.EMP=[];
          codeList.EMP.unshift({CODE:"", DISPLAY_TEXT:""});
          grdMainProps1.value.setBindingColumn('CHK_USER', codeList.EMP, 'CODE', 'DISPLAY_TEXT')
          itemField.CHK_USER=""
        }
      }
  )
}

function onAsgnChanged(newValue){
  searchParams.ASGN_CD=newValue

  commonSearchApi({ queryId: 'SPPHD0020_COMBO_07', param: {
    CMPNY_DIV : searchParams.CMPNY_DIV,
    BSNS_CD : searchParams.BSNS_CD,
    DEPT_CD : searchParams.DEPT_CD, 
    ASGN_CD : searchParams.ASGN_CD
  } })
    .then(res => {
        codeList.team = res.ORESULT_CUR
        if(codeList.team.length>0)
        {
          codeList.team.unshift({CODE:'', DISPLAY_TEXT:"전체"})  
          searchParams.TEAM_CD=''
        }
        else
        {
          codeList.team.unshift({CODE:'', DISPLAY_TEXT:"전체"})  
          searchParams.TEAM_CD=''
        }
      }
  )
}

function onCMPNYChanged(newValue){
  searchParams.CMPNY_DIV=newValue

  let param ={
    CMPNY_DIV : searchParams.CMPNY_DIV
  };

  commonSearchApi({ queryId: 'SPPHD0020_COMBO_04', param: param })
    .then(res => {
        codeList.bsns = res.ORESULT_CUR
        if(codeList.bsns.length>0)
        {
          searchParams.BSNS_CD = userStore.bsnsCd =='' ? codeList.bsns[0].CODE : userStore.bsnsCd;

          if(searchParams.BSNS_CD=="AC00")
          {
            menuTitle.value.setBtnProperty('btnPreChkResPrint', 'visible', true)
          }
          else
          {
            menuTitle.value.setBtnProperty('btnPreChkResPrint', 'visible', false)
          }
          onBsnsChanged(searchParams.BSNS_CD)
        }
      }
  )
}



function onCellEdited(grid, itemIndex, dataRow, field)
{
  if(isAdmin.value)
  // console.log("Check");
  //6 : 양호(PASS)
  //7 : 현장즉조치(ACT)
  //8 : 긴급 조치필요(URGENT)
  {
  if(field==6)
  {
    let Pass=grid.getValue(itemIndex,6)
    
    if(Pass=="true")
    {
      if(grid.getValue(itemIndex,7)=="true")
      {
        grid.setValue(itemIndex,7,"false");
        //console.log(grid.getValue(itemIndex,5));
      }
      if(grid.getValue(itemIndex,8)=="true")
      {
        grid.setValue(itemIndex,8,"false");
        // console.log(grid.getValue(itemIndex,6));
      }
      grid.setValue(itemIndex,4,dayjs().format("YYYY-MM-DD")) 
      grid.setValue(itemIndex,5,userStore.userId) 
    }
    else
    {
      grid.setValue(itemIndex,4,"")
      grid.setValue(itemIndex,5,"") 
    }
  }
  if(field==7)
  {
    let Act=grid.getValue(itemIndex,7)
    
    if(Act=="true")
    {
      if(grid.getValue(itemIndex,6)=="true")
      {
        grid.setValue(itemIndex,6,"false");
        // console.log(grid.getValue(itemIndex,4));
      }
      if(grid.getValue(itemIndex,8)=="true")
      {
        grid.setValue(itemIndex,8,"false");
        // console.log(grid.getValue(itemIndex,6));
      }
      grid.setValue(itemIndex,4,dayjs().format("YYYY-MM-DD")) 
      grid.setValue(itemIndex,5,userStore.userId) 
    }
    else
    {
      grid.setValue(itemIndex,4,"")
      grid.setValue(itemIndex,5,"") 
    }
  }
  if(field==8)
  {
    let Urgent=grid.getValue(itemIndex,8)
    
    if(Urgent=="true")
    {
      if(grid.getValue(itemIndex,6)=="true")
      {
        grid.setValue(itemIndex,6,"false");
        //  console.log(grid.getValue(itemIndex,5));
      }
      if(grid.getValue(itemIndex,7)=="true")
      {
        grid.setValue(itemIndex,7,"false");
        //  console.log(grid.getValue(itemIndex,6));
      }
      grid.setValue(itemIndex,4,dayjs().format("YYYY-MM-DD")) 
      grid.setValue(itemIndex,5,userStore.userId) 
    }
    else
    {
      grid.setValue(itemIndex,4,"") 
      grid.setValue(itemIndex,5,"") 
    }
  }
  }
}

const excelDown=()=>{

  if(searchParams.BSNS_CD=="AK00")//엔진기계사업부
  {
    searchParams.TYPN_NM=""
    
    let typn_nm = codeList.TYPN.find((item)=>item.CODE==searchParams.TYPN_SERNO).DISPLAY_TEXT;
    
    
    // console.log("typn_nm :",typn_nm);
    
    searchParams.TYPN_NM=typn_nm

    
    commonStore.loading = true
  commonRequest2('hse/excel/SPPHD0020_EXCEL_PRINT_AK00', searchParams).then((res) => {
    commonStore.loading = false


    const blob = new Blob([res], { type: res.type })
    let date=dayjs().format("YYYYMMDDhhmmss")
    const link = document.createElement('a')
    
    const fileName = `${date}_부서별 사전점검양식`.trim()
    // console.log("fileName :",fileName);
    link.href = URL.createObjectURL(blob)

    link.download = fileName
    link.click()
    URL.revokeObjectURL(link.href)
  })
  }
  else//그 외
  {
    searchParams.TYPN_NM=""
    searchParams.F_DEPT_NM=""
    let typn_nm = codeList.TYPN.find((item)=>item.CODE==searchParams.TYPN_SERNO).DISPLAY_TEXT;
    let dept_nm = codeList.dept.find((item)=>item.CODE==searchParams.DEPT_CD).DISPLAY_TEXT;
    
    searchParams.TYPN_NM=typn_nm
    searchParams.F_DEPT_NM=dept_nm
    
    commonStore.loading = true
    commonRequest2('hse/excel/SPPHD0020_EXCEL_PRINT', searchParams).then((res) => {
    commonStore.loading = false

    const blob = new Blob([res], { type: res.type })
    let date=dayjs().format("YYYYMMDDhhmmss")
    
    
    const link = document.createElement('a')
    
    //const fileName = `현황 - ${bsnsNm} ${searchParam.YEAR}년도 ${reqDivNm.trim()} ${reqChaNm} 최종산출`.trim()
    const fileName = `${date}_부서별 사전점검양식`.trim()

    link.href = URL.createObjectURL(blob)

    link.download = fileName
    link.click()
    URL.revokeObjectURL(link.href)
  })
  }
}
const preChkResultPrt = () =>{

  searchParams.TYPN_NM=""
    
    let typn_nm = codeList.TYPN.find((item)=>item.CODE==searchParams.TYPN_SERNO).DISPLAY_TEXT;
    
    // console.log("typn_nm :",typn_nm);
    
    searchParams.TYPN_NM=typn_nm

    commonStore.loading = true
  commonRequest2('hse/excel/SPPHD0020_PreChkResPrint', searchParams).then((res) => {
    commonStore.loading = false


    const blob = new Blob([res], { type: res.type })
    let date=dayjs().format("YYYYMMDDhhmmss")
    const link = document.createElement('a')
    
    const fileName = `${date}_사전점검결과`.trim()
    // console.log("fileName :",fileName);
    link.href = URL.createObjectURL(blob)

    link.download = fileName
    link.click()
    URL.revokeObjectURL(link.href)
  })

}
const dataRow=ref(null);
    //그리드 셀 클릭 이벤트
function onCellItemClicked (grid, index, col) {
  if(isAdmin.value)
  {
  if (col.fieldName === 'IMAGE_YN') {
    if(grdMainProps1.value.getGridView().getValues(col.dataRow)['SAVE_YN']=="Y")
    {
    //console.log("V1",index);
      let fileId=grdMainProps1.value.getGridView().getValues(col.dataRow)['ATTACH_ID']
      dataRow.value = col.dataRow;
      FIUploadPopup.value.openPopup(fileId);
      }
    }
  }
}

const uploaded =val=>{
  
  let saveParam=[];
  let Param={
    CMPNY_DIV : searchParams.CMPNY_DIV,
    TYPN_SERNO :searchParams.TYPN_SERNO ,
    DEPT_CD : searchParams.DEPT_CD,
    ASGN_CD : searchParams.ASGN_CD,
    SEQNO : grdMainProps1.value.getGridView().getValues(dataRow.value)['SEQNO'],
    ATTACH_ID : val.fileId,
    USER_ID : userStore.userId
  }
  saveParam.push(Param);
  // console.log("saveParam:",saveParam)
  // if(val.rowCnt>0)
  // {
  commonExecuteApi
  ({ 
      queryId : 'SPPHD0020_ATTACH_SAVE_01'
    , list: saveParam
  }).then((res)=>{
    
    onButtonsClick({id:"btnSearch"});
  })
  // }
  // else
  // {
  //   grdMainProps1.value.getDataProvider().setValue(dataRow.value,'IMAGE_YN','N')
  // }
  // grdMainProps1.value.getGridView().checkItem(dataRow.value, true)
  // grdMainProps1.value.getGridView().commit()
}

// const deleted =val=>{
//   if(val.rowCnt>0)
//   {
//     grdMainProps1.value.getDataProvider().setValue(dataRow.value,'IMAGE_YN','Y')

//   }
//   else
//   {
//     grdMainProps1.value.getDataProvider().setValue(dataRow.value,'IMAGE_YN','N')
//   }
  
// }

const TYPNChange = async e => { 
  commonSearchApi({ queryId: 'SPPHD0020_COMBO_02', param: {
    CMPNY_DIV : userStore.cmpnyDiv,
    YYYY : searchParams.TYPN_YEAR
  } })
    .then(res => {
        // console.log("res:",res)
        codeList.TYPN = res.ORESULT_CUR
        if(codeList.TYPN.length>0)
        { 
          // console.log("TYPN:",codeList.TYPN[0].CODE)
          searchParams.TYPN_SERNO=codeList.TYPN[0].CODE
        }
      }
  )
}

const chkBulkSave =()=>{
  let grdrow=grdMainProps1.value.getDataProvider().getRowCount()
  // console.log("grdrow:",grdrow)
  for (let rowIdx =0; rowIdx<grdrow; rowIdx++) {
    grdMainProps1.value
      .getDataProvider()
      .setValue(rowIdx, "CHK_DATE", itemField.CHK_DATE);
    grdMainProps1.value
      .getDataProvider()
      .setValue(rowIdx, "CHK_USER", itemField.CHK_USER);
    grdMainProps1.value
      .getGridView()
      .checkItem(rowIdx,true)
  }
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->    
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSheetInfoCopy','btnPreChkResPrint', 'btnSearch', 'btnCreate', 'btnUpdate', 'btnDelete', 'btnExcelDown']"
        @click-button="onButtonsClick"/>
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex" style="justify-content: space-between">
          <div class>          
            <v-sheet class="d-flex">
              <i-select
              v-model="searchParams.TYPN_YEAR"
              :label="$t('년도')"
              :items="codeList.TYPN_YEAR"
              item-value="CODE"
              item-title="DISPLAY_TEXT" 
              label-width="40px"
              width="150px"
              @update:modelValue="TYPNChange"
            />
            <i-select
              v-model="searchParams.TYPN_SERNO"
              :label="$t('태풍 명')"
              :items="codeList.TYPN"
              item-value="CODE"
              item-title="DISPLAY_TEXT" 
              label-width="80px"
              width="365px"
            />
            </v-sheet>
            <v-sheet class="d-flex">
            <!-- 회사 -->
            <i-select
              v-model="searchParams.CMPNY_DIV"
              :label="$t('회사')"
              :items="codeList.company"
              item-value="CODE"
              item-title="TEXT" 
              label-width="40px"
              width="250px"
              @update:modelValue="onCMPNYChanged"
            />
            <!-- 사업부 -->
            <i-select
              v-model="searchParams.BSNS_CD"
              :label="$t('사업부')"
              :items="codeList.bsns"
              item-value="CODE"
              item-title="DISPLAY_TEXT" 
              label-width="40px"
              width="210px"
              @update:modelValue="onBsnsChanged"
            />  
            <!-- 부서(팀) -->
            <i-select
              v-model="searchParams.DEPT_CD"
              :label="$t('부서(팀)')"
              :items="codeList.dept"
              item-value="CODE"
              item-title="DISPLAY_TEXT" 
              label-width="50px"
              width="210px"
              @update:modelValue="onDeptChanged"
            />     
            <!-- 과/협력사 -->
            <i-select
              v-model="searchParams.ASGN_CD"
              :label="$t('과/협력사')"
              :items="codeList.asgn"
              item-value="CODE"
              item-title="DISPLAY_TEXT" 
              label-width="60px"
              width="210px"
              @update:modelValue="onAsgnChanged"
            />     
            <!-- 팀 -->
            <i-select
              v-model="searchParams.TEAM_CD"
              :label="$t('팀')"
              :items="codeList.team"
              item-value="CODE"
              item-title="DISPLAY_TEXT" 
              label-width="20px"
              width="150px"

            />
            </v-sheet>
          </div>
          <div class="d-flex" style="align-items: center;">
            <i-input
              :label="$t('점검일자')"
              type="date"
              label-width="80px"
              width="230px"
              v-model="itemField.CHK_DATE"/>
            <i-select
              :label="$t('점검자')"
              :items="codeList.EMP"
              item-value="CODE"
              item-title="DISPLAY_TEXT" 
              label-width="60px"
              width="210px"
              v-model="itemField.CHK_USER"
            />
            <v-btn
              prepend-icon="mdi-plus"
              class="custom-flex-1"
              style="color: #fff; background: #1a40c7; padding: 4px"
              @click="chkBulkSave"
            >
              일괄등록
            </v-btn>
          </div>
          <!-- <div class="d-flex">
            <IButtonList
              :button-list="['btnSheetInfoCopy']"
              @click-button="onButtonsClick"
            />
          </div> -->
        </v-sheet>
        <v-sheet class="h-auto">
           <IGridTitle :title="$t('사전점검 항목')">
              <!-- <template #editors />
              <VRow>
                  <VCol class="d-flex justify-end align-center">
                    <span class="text-red">
                      ※ 사전점검 시트를 불러오기 위해선 사전점검 항목을 모두 삭제 후 조회하면 점검시트를 불러옵니다.
                    </span>
                  </VCol>
              </VRow> -->
            </IGridTitle>
        
          <RealGrid
            ref="grdMainProps1"
            class="mt-2"
            :grid-view-option="grd1Props.gridViewOption"
            :keys="grd1Props.keys" 
            :fields="grd1Props.fields"
            :columns="grd1Props.columns"
            @onCellEdited ="onCellEdited"
            @onCellItemClicked="onCellItemClicked"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <SPPHD0010Popup ref="spphd0010Popup" @upData="upData" />
  <IUploadPopup 
    ref="FIUploadPopup" 
    width="1200" 
    height="800"
    @uploaded="uploaded"
    :buttonList="['btnFileUpload','btnDownLoad', 'btnDelete', 'btnClose']"
    ></IUploadPopup>
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
