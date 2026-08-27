<!-- SPPHE0010Popup_03 실시간 태풍 모니터링 문자전송 팝업-->
<!-- SI2팀 마환구 2025-02-12 -->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useUserStore } from '@hiway/stores/user'
import IGridTitle from '@/components/IGridTitle.vue'
import saveFlowHelper from "@/utils/saveFlowHelper"
import { commonSearchApi, commonExecuteApi, commonSendSMS,getCodeList } from '@hiway/api/commonApi'
import { useI18n } from 'vue-i18n'
import Message from '@hiway/utils/notify'
import dayjs from "dayjs"
import IUploadImageMulit from '@/components/IUploadImageMulit.vue'

const userStore = useUserStore() //유저정보
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const dialog = ref(false)
const grdMainProps1 = ref(null)
const button = ['btnFileUpload',"btnDelete"]
const isSave = ref(null);

const DAMAGE_DATE = ref('');
const DAMAGE_DATE_FN = ref('');
const DAMAGE_TIME_FR = ref('');
const DAMAGE_TIME_FN = ref('');
const RPT_USER_NM = ref('');
const DEPT_CD = ref('');
const ASGN_CD = ref('');
const TEAM_CD = ref('');
const DAMAGE_DIV = ref('');
const L_AREA = ref('');
const M_AREA = ref('');
const S_AREA = ref('');
const SHIP_NO= ref('');
const BLK_DIV= ref('');
const STG_TYP= ref('');
const STG_DATE= ref('');
const WRK_DESC= ref('');
const WRK_QTY= ref('');
const QTY_UNIT= ref('');
const SPOT_X= ref('');
const SPOT_Y= ref('');
const REMARK= ref('');
const ATTACH_ID= ref('');

const saveParams=ref([]);
const fileUpload = ref(null)        
const btnVisible=ref(false)     

const emit = defineEmits(['closed'])




const grdProps1 = reactive({
  gridViewOption: {
    edit: {
      editable: false,
      movable: true,
    },
    stateBar: { visible: false },
    checkBar: { visible: false },
  },
  keys: [],
  fields: [
    { fieldName: "SEND_DATE", dataType: "text", width: "200", styleName: "left-column", header: { text: t("처리일") } },
    { fieldName: "TIME_FR", dataType: "text", width: "90", header: { text: t("시작시간") } },
    { fieldName: "TIME_TO", dataType: "text", width: "90", header: { text: t("완료시간") } },
    { fieldName: "TIME_USE", dataType: "text", width: "90", header: { text: t("소요시간") } },
    { fieldName: "SEND_DESC", dataType: "text", width: "90", header: { text: t("DESC") } },
    { fieldName: "SEND_CNT", dataType: "text", width: "90", header: { text: t("처리건수") } },
    { fieldName: "CMPNY_DIV", dataType: "text", visible : false },
    { fieldName: "SEND_SERNO", dataType: "text", visible : false},
  ],
  columns: [],
})

grdProps1.columns = grdProps1.fields


// ------------------------------------------------------------------------
// * 작성자 : 류원진
// * 작성일 : 2024-03-21
// * 내용   : 화면 오픈시 받아온 데이터로만 SMS 전송을 해야하는 상황에 사용하기 위해 작성함(추가, 삭제 제한)
const visible = reactive({
  gridBtn: true,  //그리드 버튼
})

// ------------------------------------------------------------------------
// 조회 파라미터

let searchParams2 = reactive({})

const detailData = reactive({
  
  CMPNY_DIV: '',
  SEND_DATE:'',
  SEND_GBN: '',
  SEND_TITLE: '156',
  SEND_MSG: '',
  SEND_DEPT: '',
  SEND_HPNO: '',
  REMARK: '',
  USER_ID: '',
})

const codeList = reactive({
  RPT_USER:[],
  DEPT: [],
  ASGN: [],
  TEAM: [],
  DAMAGE_DIV:[],
  LAREA:[],
  MAREA:[],
  SHIPNO:[],
  QTYUNIT:[],
})

const searchParams = reactive({
  CMPNY_DIV :'', 
  YEAR:'',
  TYPN_SERNO : '',
  BSNS_CD : '',
  DEPT_CD : '',
  ASGN_CD : '',
  TEAM_CD : '',
  SEQNO : ''
})



// let searchParams1 = reactive({
//   RECEIVE_CMPNY : SEND_COM.value,
//   HHI_BSNS_STR : chkHHI.value,
//   ETC_COMPANY_STR : chkETC.value,
//   HHI_OFFI_STR : chkADMIN.value,
//   ETC_DUTY_STR :chkADMINETC.value,
//   HHI_ALL_CHK : chkEMP1.value,
//   ETC_ALL_CHK : chkEMP2.value
// })

const openPopup = async (param) => {

  // console.log("param:",param)
  searchParams.CMPNY_DIV =param.CMPNY_DIV
  searchParams.TYPN_SERNO = param.TYPN_SERNO
  searchParams.BSNS_CD = param.BSNS_CD
  searchParams.DEPT_CD = param.DEPT_CD
  searchParams.ASGN_CD = param.ASGN_CD
  searchParams.TEAM_CD = param.TEAM_CD

  DEPT_CD.value=param.DEPT_CD
  ASGN_CD.value=param.ASGN_CD
  TEAM_CD.value=param.TEAM_CD
  L_AREA.value=param.L_AREA
  M_AREA.value=param.M_AREA
  btnVisible.value=param.btnVisible
  
  let div=param.DIV

  await initiCode();
  // SEND_GRID();
  await initi();

  if(div=="M")
  {
    searchParams.SEQNO = param.SEQNO

    await select_DATA();

  }
  else if(div=="C")
  {
    if(searchParams.SEQNO != "")
    {
      searchParams.SEQNO = ""
    }
    DAMAGE_DATE.value=dayjs().format("YYYY-MM-DD,HH:mm");
    // DAMAGE_TIME_FR.value=dayjs().format("HH:mm");
    // searchParams.DEPT_CD=param.DEPT_CD
    // console.log("param.DEPT_CD",param.DEPT_CD)
    // console.log("DEPT_CD",DEPT_CD.value)
    DEPT_CD.value=param.DEPT_CD

  }
  buttonHide();
  isSave.value='N'
  // imageList.value.setGuid('T2023-001')
  dialog.value = true;



}

const select_DATA= async ()=>{
  let resData;
  // console.log("pop_searchParams:",searchParams)
  commonSearchApi({
          queryId: "SPPHF0010_SEARCH_02",
          param: searchParams,
        }).then(res=>{
          resData=res.ORESULT_CUR;
          if(resData.length>0)
          {
            DAMAGE_DATE.value = resData[0].DAMAGE_DATE + ','+ resData[0].DAMAGE_TIME_FR
            DAMAGE_DATE_FN.value = !resData[0].DAMAGE_DATE_FN ? resData[0].DAMAGE_DATE_FN : resData[0].DAMAGE_DATE_FN + ',' + resData[0].DAMAGE_TIME_FN
            // DAMAGE_TIME_FR.value = resData[0].DAMAGE_TIME_FR
            // DAMAGE_TIME_FN.value = resData[0].DAMAGE_TIME_FN
            RPT_USER_NM.value = onRPT_USERChecked(resData[0].RPT_USER)
            DAMAGE_DIV.value = resData[0].DAMAGE_DIV
            L_AREA.value = resData[0].L_AREA
            M_AREA.value = resData[0].M_AREA
            S_AREA.value = resData[0].S_AREA
            SHIP_NO.value= onSHIPNOChecked(resData[0].SHIP_NO);
            BLK_DIV.value= resData[0].BLK_DIV
            STG_TYP.value= resData[0].STG_TYP
            STG_DATE.value= resData[0].STG_DATE
            WRK_DESC.value= resData[0].WRK_DESC
            WRK_QTY.value= resData[0].WRK_QTY
            QTY_UNIT.value= resData[0].QTY_UNIT
            SPOT_X.value= resData[0].SPOT_X
            SPOT_Y.value= resData[0].SPOT_Y
            REMARK.value= resData[0].REMARK
            ATTACH_ID.value= resData[0].ATTACH_ID
            DEPT_CD.value=resData[0].DEPT_CD
            ASGN_CD.value=onASGNChecked(resData[0].ASGN_CD)
            TEAM_CD.value=onTEAMChecked(resData[0].TEAM_CD)
            // ASGN_CD.value=resData[0].ASGN_CD
            // TEAM_CD.value=resData[0].TEAM_CD
          }
          else
          {
            DAMAGE_DATE.value = ''
            DAMAGE_DATE_FN.value = ''
            // DAMAGE_TIME_FR.value = ''
            // DAMAGE_TIME_FN.value = ''
            RPT_USER_NM.value = ''
            DAMAGE_DIV.value = ''
            L_AREA.value = ''
            M_AREA.value = ''
            S_AREA.value = ''
            SHIP_NO.value= ''
            BLK_DIV.value= ''
            STG_TYP.value= ''
            STG_DATE.value= ''
            WRK_DESC.value= ''
            WRK_QTY.value= ''
            QTY_UNIT.value= ''
            SPOT_X.value= ''
            SPOT_Y.value= ''
            REMARK.value= ''
            ATTACH_ID.value= ''
            DEPT_CD.value=''
            ASGN_CD.value=''
            TEAM_CD.value=''
          }

          if(DAMAGE_DATE.value=="")
          {
            DAMAGE_DATE.value=dayjs().format("YYYY-MM-DD,HH:mm");
          }
  
          // if(DAMAGE_TIME_FR.value=="")
          // {
          //   DAMAGE_TIME_FR.value=dayjs().format("HH:mm");
          // }

          if(DEPT_CD.value=="")
          {
            DEPT_CD.value=searchParams.DEPT_CD
          }

          if(ATTACH_ID.value)
          {
            fileUpload.value.setGuid(ATTACH_ID.value)
            fileUpload.value.onButtonsClick({ id: "btnSearch" })
          }
        })
}

const initi= async ()=>{
  saveParams.value=[];
  DAMAGE_DATE.value = ''
  DAMAGE_DATE_FN.value = ''
  // DAMAGE_TIME_FR.value = ''
  // DAMAGE_TIME_FN.value = ''
  RPT_USER_NM.value = ''
  DAMAGE_DIV.value = ''
  L_AREA.value = ''
  M_AREA.value = ''
  S_AREA.value = ''
  SHIP_NO.value= ''
  BLK_DIV.value= ''
  STG_TYP.value= ''
  STG_DATE.value= ''
  WRK_DESC.value= ''
  WRK_QTY.value= ''
  QTY_UNIT.value= ''
  SPOT_X.value= ''
  SPOT_Y.value= ''
  REMARK.value= ''
  ATTACH_ID.value= ''
  fileUpload.value.setGuid(ATTACH_ID.value)
  fileUpload.value.onButtonsClick({ id: "btnSearch" })
}


const initiCode= async ()=>{
  // 조회용 부서 호출(SPPHE0030_COMBO_03)  
  await commonSearchApi({ queryId: 'SPPHF0010_COMBO_05', param: {
    CMPNY_DIV : searchParams.CMPNY_DIV,
    BSNS_CD : searchParams.BSNS_CD 
  } })
    .then(res => {
        codeList.DEPT = res.ORESULT_CUR
        if(codeList.DEPT.length > 0)
        {
          codeList.DEPT.unshift({CODE:'', DISPLAY_TEXT:""})  
        }
      }
  )
  
  //과/협력사
  await commonSearchApi({ queryId: 'SPPHF0010_COMBO_06', param: {
    CMPNY_DIV : searchParams.CMPNY_DIV,
    BSNS_CD : searchParams.BSNS_CD,
    DEPT_CD : searchParams.DEPT_CD 
  } })
    .then(res => {
        codeList.ASGN = res.ORESULT_CUR
        if(codeList.ASGN.length>0)
        {
          codeList.ASGN.unshift({CODE:'', DISPLAY_TEXT:""})  
        }
        
      }
  )

  //팀
  await commonSearchApi({ queryId: 'SPPHF0010_COMBO_07', param: {
    CMPNY_DIV : searchParams.CMPNY_DIV,
    BSNS_CD : searchParams.BSNS_CD,
    DEPT_CD : searchParams.DEPT_CD, 
    ASGN_CD : searchParams.ASGN_CD
  } })
    .then(res => {
        codeList.TEAM = res.ORESULT_CUR
        if(codeList.TEAM.length>0)
        {
          codeList.TEAM.unshift({CODE:'', DISPLAY_TEXT:""})  
        }
      }
  )

  //작성자
  await commonSearchApi({ queryId: 'SPPHF0010_COMBO_12', param: {
    DEPT_CD : searchParams.DEPT_CD, 
  } })
    .then(res => {
      codeList.RPT_USER=res.ORESULT_CUR
      if(codeList.RPT_USER.length>0)
      {
        codeList.RPT_USER.unshift({CODE:'', DISPLAY_TEXT:""})  
      }
    })
  
  //피해유형
  await commonSearchApi({ queryId: 'SPPHF0010_COMBO_08', param: {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    PRNT_COD: "Z1"
  } })
    .then(res => {
      codeList.DAMAGE_DIV=res.ORESULT_CUR
      if(codeList.DAMAGE_DIV.length>0)
      {
        codeList.DAMAGE_DIV.unshift({CODE:'', DISPLAY_TEXT:""})  
      }
    })
  
  //대구역
  await commonSearchApi({ queryId: 'SPPHF0010_COMBO_09', param: {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    DEPT_CD: searchParams.DEPT_CD
  } })
    .then(res2 => {
      // console.log("res2:",res2.ORESULT_CUR)
      codeList.LAREA=res2.ORESULT_CUR
      if(codeList.LAREA.length>0)
      {
        codeList.LAREA.unshift({CODE:'', DISPLAY_TEXT:""})  
      }
    })

  await  commonSearchApi({ queryId: 'SPPHF0010_COMBO_10', param: {
          CMPNY_DIV: searchParams.CMPNY_DIV,
          L_AREA: L_AREA.value
        } })
        .then(res1 => {
            codeList.MAREA=res1.ORESULT_CUR
            if(codeList.MAREA.length>0)
            {
              codeList.MAREA.unshift({CODE:'', DISPLAY_TEXT:""})  
            }
          })
  

  //호선
  await commonSearchApi({ queryId: 'SPPHF0010_COMBO_11', param: {}})
    .then(res => {
      codeList.SHIPNO=res.ORESULT_CUR
      if(codeList.SHIPNO.length>0)
      {
        codeList.SHIPNO.unshift({CODE:'', DISPLAY_TEXT:""})  
      }
    })

  //단위
  await commonSearchApi({ queryId: 'SPPHF0010_COMBO_13', param: {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    PRNT_COD: "Z3"
  } })
    .then(res => {
      codeList.QTYUNIT=res.ORESULT_CUR
      if(codeList.QTYUNIT.length>0)
      {
        codeList.QTYUNIT.unshift({CODE:'', DISPLAY_TEXT:""})  
      }
    })  
}

const SEND_GRID = () => {
  let param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    SEND_DATE: dayjs().format("YYYYMMDD")
  }

  commonSearchApi({ queryId: 'SPPHE0010_SEARCH_13', param: param })
    .then(res => {
      grdMainProps1.value.getDataProvider().setRows(res.ORESULT_CUR);
    })
}


const onClose = () => {
  detailData.TYPE = ''
  detailData.ROWS = ''
  initi();
  dialog.value = false
  emit('closed',isSave.value)
}

defineExpose({
  openPopup,
})

const onButtonsClick = btn => {
  if (btn.id === 'btnUpdate') {
    //내용이 있는 POPUP 띄우기
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSAVE)
      .run()
  }
  else if (btn.id === 'btnClose') {
    onClose()
  }
}
const beforeSave =()=>{
  saveParams.value = []
  let data=ref([])

  if(!DAMAGE_DATE.value)
  {
    Message.warn(t('착수일자를 입력해주세요'))
    return false    
  }
  else if(DAMAGE_DATE.value && DAMAGE_DATE.value.split(/[, ]+/).length < 2)
  {
    Message.warn(t('착수일자의 일자와 시간을 모두 입력해주세요'))
    return false
  }
  else if(DAMAGE_DATE_FN.value && DAMAGE_DATE_FN.value.split(/[, ]+/).length < 2)
  {
    Message.warn(t('완료일자의 일자와 시간을 모두 입력해주세요'))
    return false
  }
  else if(!RPT_USER_NM.value)
  {
    Message.warn(t('작성자를 입력해주세요'))
    return false
  }
  else if(!DEPT_CD.value)
  {
    Message.warn(t('부서(팀)은 필수입니다.'))
    return false
  }
  else if(!DAMAGE_DIV.value)
  {
    Message.warn(t('피해유형은 필수입니다.'))
    return false
  }
  else if(!WRK_DESC.value)
  {
    Message.warn(t('피해내용을 입력해 주세요.'))
    return false
  }
  else
  {
    data.CMPNY_DIV=searchParams.CMPNY_DIV,
    data.TYPN_SERNO=searchParams.TYPN_SERNO,
    data.SEQNO=searchParams.SEQNO,
    // data.DEPT_CD=searchParams.DEPT_CD,
    // data.ASGN_CD=searchParams.ASGN_CD,
    // data.TEAM_CD=searchParams.TEAM_CD,
    data.DEPT_CD=DEPT_CD.value,
    data.ASGN_CD=ASGN_CD.value,
    data.TEAM_CD=TEAM_CD.value,
    data.RPT_USER=RPT_USER_NM.value,
    data.DAMAGE_DATE=DAMAGE_DATE.value.split(/[, ]+/)[0].replace(/-/g,"").trim(),
    data.DAMAGE_TIME_FR=DAMAGE_DATE.value.split(/[, ]+/)[1].replace(/:/g,"").trim(),
    data.DAMAGE_DATE_FN=DAMAGE_DATE_FN.value=="" ? DAMAGE_DATE_FN.value : DAMAGE_DATE_FN.value.split(/[, ]+/)[0].replace(/-/g,"").trim(),
    data.DAMAGE_TIME_FN=DAMAGE_DATE_FN.value=="" ? DAMAGE_DATE_FN.value : DAMAGE_DATE_FN.value.split(/[, ]+/)[1].replace(/:/g,"").trim(),
    data.L_AREA=L_AREA.value,
    data.M_AREA=M_AREA.value,
    data.S_AREA=S_AREA.value,
    data.SHIP_NO=SHIP_NO.value,
    data.BLK_DIV=BLK_DIV.value,
    data.STG_TYP=STG_TYP.value,
    data.DAMAGE_DIV=DAMAGE_DIV.value,
    data.WRK_DESC=WRK_DESC.value,
    data.WRK_QTY=WRK_QTY.value,
    data.QTY_UNIT=QTY_UNIT.value,
    data.SPOT_X=SPOT_X.value,
    data.SPOT_Y=SPOT_Y.value,
    data.REMARK=REMARK.value,
    data.STG_DATE=STG_DATE.value,
    data.ATTACH_ID=ATTACH_ID.value != "" ? ATTACH_ID.value : ""
    data.USER_ID = userStore.userId

  
    // saveParams.value.push(data)
    saveParams.value.push(data)
    return true
  }
}

const saveData =()=>{
  // console.log("save:",saveParams.value)
  
  return commonExecuteApi({ queryId : 'SPPHF0010_SAVE_01', list: saveParams.value})
}

const afterSAVE = (res) => {
  let resdata
  resdata=res.list
    if(resdata.length>0)
    {
      if(searchParams.SEQNO=='')
      {
        searchParams.SEQNO=resdata[0].O_SEQNO
        
      }
    }
  isSave.value='Y'
  select_DATA();
  buttonHide();
}

function onDeptChanged(newValue){
  
  searchParams.DEPT_CD=newValue
  
  commonSearchApi({ queryId: 'SPPHF0010_COMBO_06', param: {
    CMPNY_DIV : searchParams.CMPNY_DIV,
    BSNS_CD : searchParams.BSNS_CD,
    DEPT_CD : searchParams.DEPT_CD 
  } })
    .then(res => {
        codeList.ASGN = res.ORESULT_CUR
        if(codeList.ASGN.length>0)
        {
          codeList.ASGN.unshift({CODE:'', DISPLAY_TEXT:""})  
          searchParams.ASGN_CD=searchParams.ASGN_CD=="" ? "" : searchParams.ASGN_CD
          ASGN_CD.value=''
          // console.log("ASGN_CD.value:",ASGN_CD.value)
          onAsgnChanged(ASGN_CD.value)
        }
        
      }
  )

  commonSearchApi({ queryId: 'SPPHF0010_COMBO_09', param: {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    DEPT_CD: searchParams.DEPT_CD
  } })
    .then(res2 => {
      // console.log("res2:",res2.ORESULT_CUR)
      codeList.LAREA=res2.ORESULT_CUR
      L_AREA.value=''
      onLAREAChanged(L_AREA.value);
    })
}

function onAsgnChanged(newValue){

  // console.log("ASGN_newvalue:",newValue)
  searchParams.ASGN_CD=newValue

  commonSearchApi({ queryId: 'SPPHF0010_COMBO_07', param: {
    CMPNY_DIV : searchParams.CMPNY_DIV,
    BSNS_CD : searchParams.BSNS_CD,
    DEPT_CD : searchParams.DEPT_CD, 
    ASGN_CD : searchParams.ASGN_CD
  } })
    .then(res => {
        codeList.TEAM = res.ORESULT_CUR
        if(codeList.TEAM.length>0)
        {
          codeList.TEAM.unshift({CODE:'', DISPLAY_TEXT:""})  
          searchParams.TEAM_CD=''
          TEAM_CD.value=''
        }
      }
  )
}


function onLAREAChanged(newValue){
  L_AREA.value=newValue
  // console.log("L_AREA:",L_AREA.value);
    commonSearchApi({ queryId: 'SPPHF0010_COMBO_10', param: {
          CMPNY_DIV: searchParams.CMPNY_DIV,
          L_AREA: L_AREA.value
        } })
        .then(res => {
            codeList.MAREA=res.ORESULT_CUR
            M_AREA.value=''
          })
        };

const uploadCheckPicture =(val)=>
{
  ATTACH_ID.value=val.FILE_ID
  isSave.value='Y'
}

// const DAMAGE_TIME_FR_TIMEINPUT = val =>
// {
//   let hour, min
//   let time
//   DAMAGE_TIME_FR.value = val.replace(/[^0-9]/g, '');
//   time=DAMAGE_TIME_FR.value
//   if(val.length==4)
//   {
//     hour=time.substring(0,2);
//     min=time.substring(2,4);

//     if(parseInt(hour,10)>23 || parseInt(min,10)>59)
//     {
//       Message.warn(t('시간 형식이 잘못 되었습니다'))
//       DAMAGE_TIME_FR.value=""
//     }
//     else
//     {
//       DAMAGE_TIME_FR.value = hour + ":" + min
//     }
//   }
//   else if(val.length<4)
//   {
//     DAMAGE_TIME_FR.val=time
//   }
// }

// const DAMAGE_TIME_FN_TIMEINPUT = val =>
// {
//   let hour, min
//   let time
//   DAMAGE_TIME_FN.value = val.replace(/[^0-9]/g, '');
//   time=DAMAGE_TIME_FN.value
//   if(val.length==4)
//   {
//     hour=time.substring(0,2);
//     min=time.substring(2,4);

//     if(parseInt(hour,10)>23 || parseInt(min,10)>59)
//     {
//       Message.warn(t('시간 형식이 잘못 되었습니다'))
//       DAMAGE_TIME_FN.value=""
//     }
//     else
//     {
//       DAMAGE_TIME_FN.value = hour + ":" + min
//     }
//   }
//   else if(val.length<4)
//   {
//     DAMAGE_TIME_FN.val=time
//   }
// }
const onSHIPNOChecked=(newValue)=>{
  
  const isValid = codeList.SHIPNO.some(item => item.CODE === newValue);
  if(!isValid)
  {
    if(codeList.SHIPNO.length>0)
    {SHIP_NO.value = codeList.SHIPNO[0].CODE}
    else
    {SHIP_NO.value = ''}
  }
  else
  {
    SHIP_NO.value = newValue
  }
  return SHIP_NO.value
}

const onASGNChecked=(newValue)=>{
  
  const isValid = codeList.ASGN.some(item => item.CODE === newValue);
  if(!isValid)
  {
    if(codeList.ASGN.length>0)
    {ASGN_CD.value = codeList.ASGN[0].CODE}
    else
    {ASGN_CD.value = ''}
    
  }
  else
  {
    ASGN_CD.value = newValue
  }
  return ASGN_CD.value
}

const onTEAMChecked=(newValue)=>{
  
  const isValid = codeList.TEAM.some(item => item.CODE === newValue);
  
  if(!isValid)
  {
    if(codeList.TEAM.length>0)
    {TEAM_CD.value = codeList.TEAM[0].CODE}
    else
    {TEAM_CD.value = ''}
    
  }
  else
  {
    TEAM_CD.value = newValue
  }
  return TEAM_CD.value
}

const onRPT_USERChecked=(newValue)=>{

  const isValid = codeList.RPT_USER.some(item => item.CODE === newValue);
  
  if(!isValid)
  {
    if(codeList.RPT_USER.length>0)
    {RPT_USER_NM.value = codeList.RPT_USER[0].CODE}
    else
    {RPT_USER_NM.value = ''}
    
  }
  else
  {
    RPT_USER_NM.value = newValue
  }
  return RPT_USER_NM.value
}
// const DATE_CHECK =()=>
// {
//   let sDate, eDate, cDate
//   sDate=DAMAGE_DATE.value
//   eDate=DAMAGE_DATE_FN.value
//   cDate=dayjs().format("YYYY-MM-DD")

//   if(sDate>eDate)
//   {
//     Message.warn(t('종료일자는 시작일자보다 빠를 수 없습니다.'))
//     DAMAGE_DATE_FN.value=sDate
//   }
//   if(sDate>cDate)
//   {
//     Message.warn(t('시작일자는 오늘보다 뒤일 수 없습니다.'))
//     DAMAGE_DATE.value=cDate
//   }
//   if(eDate>cDate)
//   {
//     Message.warn(t('종료일자는 오늘보다 뒤일 수 없습니다.'))
//     DAMAGE_DATE_FN.value=cDate
//   }
  
//   // return DAMAGE_DATE_FN.value
// }

const btn_Click = (val) =>{
  
  
  if(val=='btnFileUpload')
  {
    if(searchParams.SEQNO)
    { 
      fileUpload.value.upcheck=true;
    }
    else if(!searchParams.SEQNO)
    {
      fileUpload.value.upcheck=false;
    }
  }
}
const buttonHide =()=>{

  
  if(btnVisible.value)
  {
    if(!searchParams.SEQNO)
    {
      fileUpload.value.disableButton('btnFileUpload')
      fileUpload.value.disableButton('btnDelete')
    }
    else
    {
      fileUpload.value.enableButton('btnFileUpload')
      fileUpload.value.enableButton('btnDelete')
    }
  }
  else
  {
    fileUpload.value.disableButton('btnFileUpload')
    fileUpload.value.disableButton('btnDelete')
  }
}
</script>

<template style="margin: 0px">
  <v-dialog v-model="dialog" eager persistent 
  width="1050" 
  height="870"
  class="p-absolute user-select-none" 
    >
    <v-sheet color="primarySub" height="50" class="px-4 d-flex align-center rounded-t-5 cursor-move"
      >
      <span>태풍 피해 현황 및 복구 실적등록</span>
    </v-sheet>
    <!-- <v-card class="pa-0 fill-height rounded-b-5"> -->
      <v-card class="pa-0 rounded-b-5 h-full" >
      <v-card-title class="pa-4 pb-2">
        <IGridTitle :use-permission="true" :button-list="['btnUpdate','btnClose']" @click-button="onButtonsClick" />
        <!-- <IButtonList
              :button-list="['btnContent','btnSend','btnDelete','btnSendHis','btnClose']"
              @click-button="onButtonsClick"/> -->
      </v-card-title>
      <v-card-text class="pa-4 pt-0">
        <VRow class="d-flex flex-column searchArea" style="margin bottom: 5px; padding : 10px">
          <VCol class="d-flex cols-padding" >
          <i-input 
              :label="$t('착수')" type="text"
              labelWidth="80px"
              width="49%"
              margin="1%"
              v-model="DAMAGE_DATE"
              top-label
              required
            />
            <!-- @change="DATE_CHECK" -->
            <!-- :label="$t('시작시간')" type="text" 
            required="true"-->
            <!-- <i-input 
              width="24%"
              margin="1%"
              labelWidth="80px"
              maxlength="4"
              v-model="DAMAGE_TIME_FR"
              @input="DAMAGE_TIME_FR_TIMEINPUT(DAMAGE_TIME_FR)"
              top-label
            /> -->
            <i-input 
              :label="$t('완료')" type="text"
              width="49%"
              margin="1%"
              labelWidth="80px"
              v-model="DAMAGE_DATE_FN"
              top-label
            />
            <!-- @change="DATE_CHECK" -->
            <!-- :label="$t('종료시간')" type="text" -->
            <!-- <i-input 
              
              width="24%"
              margin="1%"
              labelWidth="80px"
              maxlength="4"
              v-model="DAMAGE_TIME_FN"
              @input="DAMAGE_TIME_FN_TIMEINPUT(DAMAGE_TIME_FN)"
              top-label
            /> -->
          </VCol>
          <VCol class="d-flex cols-padding" >
            <i-select 
              :label="$t('작성자')" type="text"
              width="24%"
              margin="1%"
              labelWidth="80px"
              :items="codeList.RPT_USER"
              item-value="CODE"
              item-title="DISPLAY_TEXT" 
              v-model="RPT_USER_NM"
              top-label
              required
            />
            <i-select 
              :label="$t('부서(팀)')" type="text"
              width="24%"
              margin="1%"
              labelWidth="80px"
              :items="codeList.DEPT"
              item-value="CODE"
              item-title="DISPLAY_TEXT" 
              v-model="DEPT_CD"
              @update:modelValue="onDeptChanged"
              top-label
              required
            />
            <i-select 
              :label="$t('과/협력사')" type="text"
              width="24%"
              margin="1%"
              labelWidth="80px"
              :items="codeList.ASGN"
              item-value="CODE"
              item-title="DISPLAY_TEXT" 
              v-model="ASGN_CD"
              @update:modelValue="onAsgnChanged"
              top-label
            />
            <i-select 
              :label="$t('팀')" type="text"
              width="24%"
              margin="1%"
              labelWidth="80px"
              :items="codeList.TEAM"
              item-value="CODE"
              item-title="DISPLAY_TEXT" 
              v-model="TEAM_CD"
              top-label
            />
          </VCol>
          <VCol class="d-flex cols-padding">
            <i-select 
              :label="$t('피해유형')" type="text"
              width="24%"
              margin="1%"
              labelWidth="80px"
              :items="codeList.DAMAGE_DIV"
              item-value="CODE"
              item-title="DISPLAY_TEXT" 
              v-model="DAMAGE_DIV"
              top-label
              required
            />
            <i-select 
              :label="$t('대구역')" type="text"
              width="24%"
              margin="1%"
              labelWidth="80px"
              :items="codeList.LAREA"
              item-value="CODE"
              item-title="DISPLAY_TEXT" 
              v-model="L_AREA"
              @update:modelValue="onLAREAChanged"
              top-label
            />
            <i-select 
              :label="$t('중구역')" type="text"
              width="24%"
              margin="1%"
              labelWidth="80px"
              :items="codeList.MAREA"
              item-value="CODE"
              item-title="DISPLAY_TEXT" 
              v-model="M_AREA"
              top-label
            />
            <i-input
              :label="$t('소구역')" type="text"
              width="24%"
              margin="1%"
              labelWidth="80px"
              v-model="S_AREA"
              top-label
            />
          </VCol>
          <VCol class="d-flex cols-padding">
            <i-select 
              :label="$t('호선')" type="text"
              width="24%"
              margin="1%"
              labelWidth="80px"
              :items="codeList.SHIPNO"
              item-value="CODE"
              item-title="DISPLAY_TEXT" 
              v-model="SHIP_NO"
              top-label
            />
            <i-input 
              :label="$t('블록/구획')" type="text"
              width="24%"
              margin="1%"
              labelWidth="80px"
              v-model="BLK_DIV"
              top-label
            />
            <i-input 
              :label="$t('공정/공종')" type="text"
              width="24%"
              margin="1%"
              labelWidth="80px"
              v-model="STG_TYP"
              top-label
            />
            <i-input 
              :label="$t('공정영향(일)')" type="text"
              width="24%"
              margin="1%"
              labelWidth="80px"
              v-model="STG_DATE"
              top-label
            />
          </VCol>
          <VCol class="d-flex cols-padding">
            <i-input 
              :label="$t('피해내용')" type="text"
              margin="1%"
              labelWidth="80px"
              width="100%"
              v-model="WRK_DESC"
              top-label
              required
            />
          </VCol>
          <VCol class="d-flex cols-padding">
            <i-input
              :label="$t('투입/물량')" type="text"
              width="24%"
              margin="1%"
              labelWidth="80px"
              v-model="WRK_QTY"
              top-label
            />
            <i-select 
              :label="$t('단위')" type="text"
              width="24%"
              margin="1%"
              labelWidth="80px"
              :items="codeList.QTYUNIT"
              item-value="CODE"
              item-title="DISPLAY_TEXT" 
              v-model="QTY_UNIT"
              top-label
            />
            <i-input 
              :label="$t('경도')" type="text"
              width="24%"
              margin="1%"
              labelWidth="80px"
              v-model="SPOT_X"
              top-label
            />
            <i-input 
              :label="$t('위도')" type="text"
              width="24%"
              margin="1%"
              labelWidth="80px"
              v-model="SPOT_Y"
              top-label
            />
          </VCol>
          <VCol class="d-flex cols-padding">
            <i-input 
              :label="$t('비고')" type="text"
              margin="1%"
              labelWidth="80px"
              width="100%"
              v-model="REMARK"
              top-label
            />
          </VCol>
          <div v-if="!searchParams.SEQNO" style="color: red;margin: 5px;padding: 5px;">※ 내용 저장 후 파일을 업로드 하실 수 있습니다. </div>
        </VRow>
        <VRow>
          <VCol class="cols-padding" cols="12" md="12">
            <IUploadImageMulit
            ref="fileUpload"
            height="265"
            class="mr-2"
            @uploaded="uploadCheckPicture"
            :button-list="button"
            image-sheet-width="100%"
            file-grid-width="100%"
            @btnCheck="btn_Click"
          ></IUploadImageMulit>
          </VCol>
        </VRow>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 250px);
  //overflow-y: auto;
  > div {
    // min-height: 700px;
  }
}

.cols-padding{
  padding : 0px;
}

</style>