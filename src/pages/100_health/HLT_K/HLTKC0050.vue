<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import dayjs from "dayjs"
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import VendTreePopup from '@/components/popup/VendTreePopup.vue'
import IButtonList from '@/components/IButtonList.vue'
import HLTKC0050Popup01 from './HLTKC0050Popup01.vue'
import HLTKC0050Popup02 from './HLTKC0050Popup02.vue'
import HLTKC0050Popup03 from './HLTKC0050Popup03.vue'
// import HLTKC0050Popup02 from './HLTKC0050Popup02.vue'
import { commonSearchApi, commonExecuteApi, getCodeList, commonLogExecuteApi } from '@hiway/api/commonApi'
import { commonDownloadFilesApi} from "@hiway/api/commonFileApi"


            
defineOptions({
  name: '100_health-HLT_K-HLTKC0050',
})


const userStore = useUserStore()
const vendTreePopup = ref(null)
const grdMain = ref(null)


const HLTKC0050Popup_01=ref(null)
const HLTKC0050Popup_02=ref(null)
const HLTKC0050Popup_03=ref(null)
const popupParam=reactive({})
const FILE=ref([]);
const inputClear =ref(false);
const isIp = ref(false)


const menuTitle= ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어


const codeList = reactive({
  //구분
  // Quarter : []
})

const Quarter = ref([
  { TXT: '1분기', COD: '1' },
  { TXT: '2분기', COD: '2' },
  { TXT: '3분기', COD: '3' },
  { TXT: '4분기', COD: '4' }
])


const initCodeList = async () => {

  // if(!isIp.value) {
  //   return showNoIp()
  // }

  let month = dayjs().format("MM")
  if (['01', '02', '03'].includes(month)) {
  // console.log('1')
  searchParam.QUARTER = '1'
} else if (['04', '05', '06'].includes(month)) {
  // console.log('2')
  searchParam.QUARTER = '2'
} else if (['07', '08', '09'].includes(month)) {
  // console.log('3')
  searchParam.QUARTER = '3'
} else if (['10', '11', '12'].includes(month)) {
  // console.log('4')
  searchParam.QUARTER = '4'
}
}

const searchParam = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  YEAR : dayjs().format("YYYY"),
  QUARTER : '1',
  VEND_NM : '',
  VEND_CD : ''
})

const saveParam =ref([]);

const grdMainProps1 = reactive({
  gridViewOption: { checkBar: { visible: true}},
  fields: [
  {
      fieldName: 'BSNS_NM',
      dataType: 'text',
      header: { text: t('사업부') },
      editable: false,
      visible : true,
      width : '100'
    },
  {
      fieldName: 'ASGN_NM',
      dataType: 'text',
      header: { text: t('부서') },
      editable: false,
      visible : true,
      width : '120'
    },
    {
      fieldName: 'VEND_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('협력사') },
      styleName : 'center-column',
      width : '120'
    },
    {
      fieldName: 'KOR_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('성명') },
      styleName : 'center-column',
      width : '80'
    },
    {
      fieldName: 'BIRTH_DAY',
      dataType: 'text',
      editable: false,
      header: { text: t('생년월일') },
      styleName : 'center-column',
      width : '100'
    },
    {
      fieldName: 'AGE_INT',
      dataType: 'text',
      editable: false,
      header: { text: t('만나이') },
      styleName : 'right-column',
      width : '50'
    },
    {
      fieldName: 'SEX',
      dataType: 'text',
      editable: false,
      header: { text: t('성별') },
      styleName : 'center-column',
      width : '50'
    },
    {
      fieldName: 'EMP_NO',
      dataType: 'text',
      editable: false,
      header: { text: t('등록번호') },
      styleName : 'center-column',
      width : '80'
    },
    {
      fieldName: 'NATION',
      dataType: 'text',
      editable: false,
      header: { text: t('국적') },
      styleName : 'left-column',
      width : '80',
      visible : true
    },
    {
      fieldName: 'STATURE',
      dataType: 'text',
      editable: false,
      header: { text: t('키') },
      styleName : 'right-column',
      width : '80'
    },
    {
      fieldName: 'WEIGHT',
      dataType: 'text',
      editable: false,
      header: { text: t('몸무게') },
      styleName : 'right-column',
      width : '80'
    },
    {
      fieldName: 'BMI',
      dataType: 'text',
      editable: false,
      header: { text: t('BMI') },
      styleName : 'right-column',
      width : '80'
    },
    {
      fieldName: 'SMOKE_YN',
      dataType: 'text',
      editable: false,
      header: { text: t('흡연여부') },
      styleName : 'center-column',
      width : '80'
    },
    {
      fieldName: 'DRUNK_YN',
      dataType: 'text',
      editable: false,
      header: { text: t('음주여부') },
      styleName : 'center-column',
      width : '80'
    },
    {
      fieldName: 'PAST_NM',
      dataType: 'text',
      editable: false,
      header: { text: t('과거질환') },
      styleName : 'left-column',
      width : '100'
    },
    {
      fieldName: 'UNDER_DESC',
      dataType: 'text',
      editable: false,
      header: { text: t('현재질환') },
      styleName : 'left-column',
      width : '100'
    },
    {
      fieldName: 'CREATE',
      dataType: 'text',
      editable: false,
      header: { text: t('신규추가') },
      styleName : 'center-column',
      width : '70',
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          return `
            <div style="display: flex; align-items: center; justify-content: center;">
              <button 
                class="v-btn" 
                style="color: #fff; background: green; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;"
              >등록</button>
            </div>
          `;
        }
      }
    },
    {
      fieldName: 'PAST',
      dataType: 'text',
      editable: false,
      header: { text: t('이전건강상태') },
      styleName : 'center-column',
      width : '70',
      styleCallback: function(grid, dataCell) {
        let ret = {}
        const iconSize = 15
        ret.renderer = {
          type: 'icon',
          iconLocation: 'center',
          iconCallback: function(grid, cell) {
            return new URL('/src/assets/icons/svg/search.svg', import.meta.url).href
          },
          iconHeight: iconSize,
          iconWidth: iconSize,
        }
        
        return ret;
      },
    },
    {
      fieldName: 'BP',
      dataType: 'text',
      editable: false,
      header: { text: t('혈압') },
      styleName : 'right-column',
      width : '100'
    },
    {
      fieldName: 'BG',
      dataType: 'text',
      editable: false,
      header: { text: t('혈당') },
      styleName : 'right-column',
      width : '100'
    },
    {
      fieldName: 'HBA1C',
      dataType: 'text',
      editable: false,
      header: { text: t('당화혈색소') },
      styleName : 'right-column',
      width : '100'
    },
    {
      fieldName: 'LDL',
      dataType: 'text',
      editable: false,
      header: { text: t('LDL 콜레스테롤'), useHtml:true },
      styleName : 'right-column',
      width : '100'
    },
    {
      fieldName: 'TG',
      dataType: 'text',
      editable: false,
      header: { text: t('중성지방') },
      styleName : 'right-column',
      width : '100'
    },
    {
      fieldName: 'TC',
      dataType: 'text',
      editable: false,
      header: { text: t('총 콜레스테롤')},
      styleName : 'right-column',
      width : '100'
    },
    {
      fieldName: 'GS',
      dataType: 'text',
      editable: false,
      header: { text: t('악력') },
      styleName : 'right-column',
      width : '100'
    },
    {
      fieldName: 'MS',
      dataType: 'text',
      editable: false,
      header: { text: t('근력') },
      styleName : 'right-column',
      width : '100'
    },
    {
      fieldName: 'EC',
      dataType: 'text',
      editable: false,
      header: { text: t('운동능력') },
      styleName : 'right-column',
      width : '100'
    },
    {
      fieldName: 'MT_YN',
      dataType: 'text',
      editable: false,
      header: { text: t('관리대상 여부') },
      styleName : 'center-column',
      width : '100',
      renderer: {
        type: 'html',
        callback: function (grid, cell, w, h) {
          const value = grid.getValue(cell.index.itemIndex, 'MT_YN')
          if (value == 'Y') {
            return `
              <div style="display: flex; align-items: center; justify-content: center;">
                <button 
                  class="v-btn" 
                  style="color: #fff; background: green; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;"
                >대상</button>
              </div>
            `;
          } else if(value == 'N'){ 
            return `
              <div style="display: flex; align-items: center; justify-content: center;">
                <button 
                  class="v-btn" 
                  style="color: #fff; background: #1a40c7; padding: 4px 12px; min-width: 80px; cursor: default; pointer-events: none;"
                >비대상</button>
              </div>
            `;
          }
          else
          {
            return '';
          }
        }
      }
    },
    {
      fieldName: 'FILE_1',
      dataType: 'text',
      editable: false,
      header: { text: t('개인정보 동의서') },
      styleName : 'center-column',
      width : '100',
      styleCallback: function(grid, dataCell) {
        let ret = {}
        const iconSize = 15
        ret.renderer = {
          type: 'icon',
          iconLocation: 'center',
          iconCallback: function(grid, cell) {
            return new URL('/src/assets/icons/svg/search.svg', import.meta.url).href
          },
          iconHeight: iconSize,
          iconWidth: iconSize,
        }
        
        return ret;
      },
    },
    {
      fieldName: 'FILE_2',
      dataType: 'text',
      editable: false,
      header: { text: t('건강상담지') },
      styleName : 'center-column',
      width : '100',
      styleCallback: function(grid, dataCell) {
        let ret = {}
        const iconSize = 15
        ret.renderer = {
          type: 'icon',
          iconLocation: 'center',
          iconCallback: function(grid, cell) {
            return new URL('/src/assets/icons/svg/search.svg', import.meta.url).href
          },
          iconHeight: iconSize,
          iconWidth: iconSize,
        }
        
        return ret;
      },
    },
    {
      fieldName: 'BSNS_CD',
      dataType: 'text',
      editable: false,
      visible : false
    },
    {
      fieldName: 'ASGN_CD',
      dataType: 'text',
      editable: false,
      visible : false
    },
    {
      fieldName: 'VEND_CD',
      dataType: 'text',
      editable: false,
      visible : false
    },
    {
      fieldName: 'FILE_ID_1',
      dataType: 'text',
      editable: false,
      visible : false
    },
    {
      fieldName: 'FILE_ID_2',
      dataType: 'text',
      editable: false,
      visible : false
    },
    {
      fieldName: 'IDX_SEQ',
      dataType: 'text',
      editable: false,
      visible : false
    },
    {
      fieldName: 'NATN_CD',
      dataType: 'text',
      editable: false,
      visible : false,
      header: { text: t('국적') },
      styleName : 'right-column',
      width : '80'
    },
    {
      fieldName: 'ALERT_YN',
      dataType: 'text',
      editable: false,
      visible : false,
      header: { text: t('알림여부') },
      styleName : 'right-column',
      width : '80'
    },
    {
      fieldName: 'BASE_SEQ',
      dataType: 'text',
      editable: false,
      visible : false
    },
    {
      fieldName: 'COM_ENT_DATE',
      dataType: 'text',
      editable: false,
      visible : false
    },
    {
      fieldName: 'RETI_TMP_DATE',
      dataType: 'text',
      editable: false,
      visible : false
    },
    {
      fieldName: 'PLAN_SEX',
      dataType: 'text',
      editable: false,
      visible : false
    },
  ],
  columnLayout :[
    {
      name:'인적사항',
      direction: 'horizontal',
      items:['BSNS_NM', 'ASGN_NM', 'VEND_NM',
      'KOR_NM', 'BIRTH_DAY', 'AGE_INT', 'SEX', 'EMP_NO', 'NATION']
    }, 
    {
      name:'기초 건강정보',
      direction: 'horizontal',
      items:['STATURE', 'WEIGHT', 'BMI', 'SMOKE_YN', 'DRUNK_YN',
            'PAST_NM', 'UNDER_DESC']
    }, 
    'CREATE','PAST',
    {
      name:'현재 건강상태',
      direction: 'horizontal',
      items:['BP', 'BG', 'HBA1C', 'LDL', 'TG',
            'TC', 'GS', 'MS', 'EC', 'MT_YN']
    }, 
    {
      name:'첨부',
      direction: 'horizontal',
      items:['FILE_1', 'FILE_2']
    }, 
    'BSNS_CD', 'ASGN_CD', 'VEND_CD', 'FILE_ID_1', 'FILE_ID_2', 'IDX_SEQ', 'NATN_CD', 'ALERT_YN','BASE_SEQ','COM_ENT_DATE','RETI_TMP_DATE','PLAN_SEX'
  ]
})
grdMainProps1.columns = grdMainProps1.fields



onMounted( async () => {

  await userPer()

  await initCodeList()

    if(!isIp.value) {
    return showNoIp()
  }
  // grdMain.value.getGridView().filterPanel.visible = true;
  //grdMain2.value.getGridView().filterPanel.visible = true;
})

const userPer = async () =>
{
  //GRP00397 : 협력사 모듈 권한자
  //GRP00385 : 협력사 기본
  //GRP00382 : 보건 직원
  //GRP00376 : 협력사 모듈 관리자
  //GRP00372 : 보건 총괄관리자
  //HLTK001 : 협력사 보건관리 모듈 관리자

  if(userStore.userDiv !='A')
  {
    const res = await userStore.getAuthIpMenus();  // ← await 추가
    if(res.filter(item =>
      item.EMP_NO == userStore.empNo &&
      item.PGM_ID == useLogsStore().menuId &&
      item.IP_ADD == userStore.clientIp
    ).length > 0) {
      isIp.value = true;
    }
      
      // menuTitle.value.visibleBtn('btnSendAlert',false)
      // onButtonsClick({ id: 'btnSearch' })
      grdMain.value.getGridView().filterPanel.visible = true
    
    
  }
  else
  {
    if (['GRP00382', 'GRP00372', 'HLTK001'].some(code => userStore.authGrpCd.includes(code)))
    {

      const res = await userStore.getAuthIpMenus();  // ← await 추가
    if(res.filter(item =>
      item.EMP_NO == userStore.empNo &&
      item.PGM_ID == useLogsStore().menuId &&
      item.IP_ADD == userStore.clientIp
    ).length > 0) {
      searchParam.VEND_CD=userStore.asgnCd
      // menuTitle.value.visibleBtn('btnCreate','Y')
      // menuTitle.value.visibleBtn('btnSendAlert',true)
      inputClear.value=true;
      isIp.value = true
    }
      // onButtonsClick({ id: 'btnSearch' })
      grdMain.value.getGridView().filterPanel.visible = true
    }
    
  }
}



const onButtonsClick = (btn) => {

  
  if(!isIp.value) {
    return showNoIp()
  }

  if(btn.id === 'btnSearch'){
    // console.log("searchParams:",searchParams)
    getData();
  }
  else if(btn.id=='btnCreate')
  {
    openPopup("C");
  }
  else if(btn.id=='btnSendAlert')
  {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setConfirmMessage('알림발송 하시겠습니까?')
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
  }
  else if(btn.id='btnBaseHealthAdd')
  {
    openPopupP();
  }
}
const openPopup=(value)=>
{
  popupParam.DIV=value
  if(value=="C")
  {
    popupParam.IDX_SEQ=0
    let row = grdMain.value.getGridView().getCheckedRows();
    
    if(row.length==0)
    {
      return Message.warn(t('건강상태를 입력하기 위한 근로자가 선택되지 않았습니다.'))
    }
    else if(row.length > 1)
    {
      return Message.warn(t('건강상태 입력은 한 명만 선택하여야 합니다.'))
    }
    else
    {
      let rowData = grdMain.value.getDataProvider().getJsonRow(row)

      popupParam.IDX_SEQ=rowData.IDX_SEQ == null ? '0' : rowData.IDX_SEQ
      popupParam.BSNS_CD=rowData.BSNS_CD
      popupParam.ASGN_CD=rowData.ASGN_CD
      popupParam.VEND_CD=rowData.VEND_CD
      popupParam.BSNS_NM=rowData.BSNS_NM
      popupParam.ASGN_NM=rowData.ASGN_NM
      popupParam.VEND_NM=rowData.VEND_NM
      popupParam.EMP_NO=rowData.EMP_NO
      popupParam.EMP_NM=rowData.KOR_NM
      popupParam.AGE_INT=rowData.AGE_INT
      popupParam.FILE_ID_1=rowData.FILE_ID_1
      popupParam.FILE_ID_2=rowData.FILE_ID_2
      popupParam.BIRTH_DAY=rowData.BIRTH_DAY
      popupParam.NATN_CD=rowData.NATN_CD
      popupParam.NATION=rowData.NATION
      popupParam.SEX=rowData.SEX
      popupParam.BASE_SEQ=rowData.BASE_SEQ
      popupParam.PLAN_SEX=rowData.PLAN_SEX
      popupParam.COM_ENT_DATE=rowData.COM_ENT_DATE
      popupParam.RETI_TMP_DATE=rowData.RETI_TMP_DATE
    }
  }
  HLTKC0050Popup_01.value.openPopup(popupParam);
}

const openPopupR=(value)=>
{
  popupParam.IDX_SEQ=value;
  HLTKC0050Popup_02.value.openPopup(popupParam);
}

const openPopupP=()=>
{
  console.log("pop:",popupParam)
  if(popupParam.BASE_SEQ == 1)
  {
    return Message.warn(t('이미 기초건강정보가 입력되어 있습니다.'))
    
  }
  else
  {
    let row = grdMain.value.getGridView().getCheckedRows();
    
    if(row.length==0)
    {
      return Message.warn(t('기초건강정보 입력을 하기 위한 근로자가 선택되지 않았습니다.'))
    }
    else if(row.length > 1)
    {
      return Message.warn(t('기초건강정보 입력은 한 명만 선택하여야 합니다.'))
    }
    else
    {
      let rowData = grdMain.value.getDataProvider().getJsonRow(row)

      popupParam.IDX_SEQ=rowData.IDX_SEQ == null ? '0' : rowData.IDX_SEQ
      popupParam.BSNS_CD=rowData.BSNS_CD
      popupParam.ASGN_CD=rowData.ASGN_CD
      popupParam.VEND_CD=rowData.VEND_CD
      popupParam.BSNS_NM=rowData.BSNS_NM
      popupParam.ASGN_NM=rowData.ASGN_NM
      popupParam.VEND_NM=rowData.VEND_NM
      popupParam.EMP_NO=rowData.EMP_NO
      popupParam.EMP_NM=rowData.KOR_NM
      popupParam.AGE_INT=rowData.AGE_INT
      popupParam.FILE_ID_1=rowData.FILE_ID_1
      popupParam.FILE_ID_2=rowData.FILE_ID_2
      popupParam.BIRTH_DAY=rowData.BIRTH_DAY
      popupParam.NATN_CD=rowData.NATN_CD
      popupParam.NATION=rowData.NATION
      popupParam.SEX=rowData.SEX
      popupParam.BASE_SEQ=rowData.BASE_SEQ
      popupParam.PLAN_SEX=rowData.PLAN_SEX
      popupParam.COM_ENT_DATE=rowData.COM_ENT_DATE
      popupParam.RETI_TMP_DATE=rowData.RETI_TMP_DATE
    }
  }
  HLTKC0050Popup_03.value.openPopup(popupParam)
}

const getData = () => {

  new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
}

const beforeSearch = async () =>{

  return true;
}
const searchData = async () =>{
  // console.log("searchParam:",searchParam)
  
  return commonSearchApi({
    queryId: 'HLTKC0050_SEARCH_01',
    param: searchParam,
    })
}

const afterSearch =(res) =>{
  
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);

  let params = {
    userStore: userStore,
    params: searchParam,
    mgs: '개인정보관련 조회했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
}

const openVendPopup = () => {
  if(!isIp.value) {
    return showNoIp()
  }
  vendTreePopup.value.openPopup({ ORGN_DIV: 'B', DEPT_CD : searchParam.VEND_CD })
}

const selectedVend = (data) => {  
  searchParam.VEND_CD = data.ASGN_CD
  searchParam.VEND_NM = data.ASGN_NM
  getData()
}

const onCellDblClicked = (grid, col) => {
  
  if(!isIp.value) {
    return showNoIp()
  }
  // if (!['GRP00382', 'GRP00372', 'HLTK001'].some(code => userStore.authGrpCd.includes(code)))
  //   {
  //     return Message.warn(t('수정할 권한이 없습니다.'))
  //   }
  if(grdMain.value.getGridView().getValues(col.dataRow)['IDX_SEQ'])
  {
    const gridView = grdMain.value.getGridView();
    
    let row=gridView.getSelectedRows();

    let rowData= grdMain.value.getDataProvider().getJsonRow(row)
    
    popupParam.BP=rowData.BP
    popupParam.BG=rowData.BG
    popupParam.HBA1C=rowData.HBA1C
    popupParam.LDL=rowData.LDL
    popupParam.TG=rowData.TG
    popupParam.TC=rowData.TC
    popupParam.GS=rowData.GS
    popupParam.MS=rowData.MS
    popupParam.EC=rowData.EC
    popupParam.MT_YN=rowData.MT_YN
    popupParam.FILE_ID_1=rowData.FILE_ID_1
    popupParam.FILE_ID_2=rowData.FILE_ID_2
  
    openPopup("M")
  }
  else
  {
    return Message.warn(t("등록된 내역이 없습니다."))
  }
}

const onCurrentChanged = async (grid, oldRow, newRow) =>{
  
  
  const gridView = grdMain.value.getGridView();
  
  let row=grdMain.value.getGridView().getSelectedRows();

  let rowData = grdMain.value.getDataProvider().getJsonRow(row)
  // gridView.checkAll(false);
  // gridView.checkItem(row,true)

  popupParam.CMPNY_DIV=userStore.cmpnyDiv
  popupParam.YEAR=searchParam.YEAR
  popupParam.QUARTER=searchParam.QUARTER
  // popupParam.IDX_SEQ=gridView.getValues(row)['IDX_SEQ'] == null ? '0' : gridView.getValues(row)['IDX_SEQ']
  // popupParam.BSNS_CD=gridView.getValues(row)['BSNS_CD']
  // popupParam.ASGN_CD=gridView.getValues(row)['ASGN_CD']
  // popupParam.VEND_CD=gridView.getValues(row)['VEND_CD']
  // popupParam.BSNS_NM=gridView.getValues(row)['BSNS_NM']
  // popupParam.ASGN_NM=gridView.getValues(row)['ASGN_NM']
  // popupParam.VEND_NM=gridView.getValues(row)['VEND_NM']
  // popupParam.EMP_NO=gridView.getValues(row)['EMP_NO']
  // popupParam.EMP_NM=gridView.getValues(row)['KOR_NM']
  // popupParam.AGE_INT=gridView.getValues(row)['AGE_INT']
  // popupParam.FILE_ID_1=gridView.getValues(row)['FILE_ID_1']
  // popupParam.FILE_ID_2=gridView.getValues(row)['FILE_ID_2']
  // popupParam.BIRTH_DAY=gridView.getValues(row)['BIRTH_DAY']
  // popupParam.NATN_CD=gridView.getValues(row)['NATN_CD']
  // popupParam.NATION=gridView.getValues(row)['NATION']
  // popupParam.SEX=gridView.getValues(row)['SEX']
  // popupParam.BASE_SEQ=gridView.getValues(row)['BASE_SEQ']
  // popupParam.PLAN_SEX=gridView.getValues(row)['PLAN_SEX']
  // popupParam.COM_ENT_DATE=gridView.getValues(row)['COM_ENT_DATE']
  // popupParam.RETI_TMP_DATE=gridView.getValues(row)['RETI_TMP_DATE']


  popupParam.IDX_SEQ=rowData.IDX_SEQ == null ? '0' : rowData.IDX_SEQ
  popupParam.BSNS_CD=rowData.BSNS_CD
  popupParam.ASGN_CD=rowData.ASGN_CD
  popupParam.VEND_CD=rowData.VEND_CD
  popupParam.BSNS_NM=rowData.BSNS_NM
  popupParam.ASGN_NM=rowData.ASGN_NM
  popupParam.VEND_NM=rowData.VEND_NM
  popupParam.EMP_NO=rowData.EMP_NO
  popupParam.EMP_NM=rowData.KOR_NM
  popupParam.AGE_INT=rowData.AGE_INT
  popupParam.FILE_ID_1=rowData.FILE_ID_1
  popupParam.FILE_ID_2=rowData.FILE_ID_2
  popupParam.BIRTH_DAY=rowData.BIRTH_DAY
  popupParam.NATN_CD=rowData.NATN_CD
  popupParam.NATION=rowData.NATION
  popupParam.SEX=rowData.SEX
  popupParam.BASE_SEQ=rowData.BASE_SEQ
  popupParam.PLAN_SEX=rowData.PLAN_SEX
  popupParam.COM_ENT_DATE=rowData.COM_ENT_DATE
  popupParam.RETI_TMP_DATE=rowData.RETI_TMP_DATE
}

const searchFile = async(fileId) => {
  console.log('id:',fileId)  
  const param = { FILE_ID: fileId }
  return commonSearchApi({ queryId: 'searchFile', param: param }).then(res => {
    FILE.value = res.ORESULT_CUR[0]
  })
}

const downFile = async() =>{
console.log('FILE:',FILE.value)
if (!FILE.value) {
  Message.err(t("다운로드할 파일이 없습니다."))
  return false
}

commonDownloadFilesApi(FILE.value)
  .then((res) => {
    const file = res.contentDisposition.split('fileName="')
    const blob = new Blob([res])
    const link = document.createElement("a")

    link.href = URL.createObjectURL(blob)

    link.download = decodeURI(file[1].replace('";', ""))
    link.click()
    URL.revokeObjectURL(link.href)

    Message.success(t("다운로드 되었습니다."))

    let params = {
    userStore: userStore,
    params: searchParam,
    mgs: '개인정보관련 다운로드했습니다.',
    crudGbn: 'P', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
  })
  .catch((e) => {
    console.log('error:',e)
    Message.err(t("파일을 가져오지 못하였습니다."))
  })
}

const onCellItemClicked = async (grid, index, col) => {
  if (col.fieldName === 'PAST') 
  {    
    openPopupR(grdMain.value.getGridView().getValues(col.dataRow)['IDX_SEQ'])
  }
  else if (col.fieldName === 'FILE_1')
  {
    await searchFile(grdMain.value.getGridView().getValues(col.dataRow)['FILE_ID_1'])
    await downFile()
  }
  else if (col.fieldName === 'FILE_2')
  {
    await searchFile(grdMain.value.getGridView().getValues(col.dataRow)['FILE_ID_2'])
    await downFile()
  }
  else if (col.fieldName === 'CREATE')
  { 
    if (!['GRP00382', 'GRP00372', 'HLTK001'].some(code => userStore.authGrpCd.includes(code)))
    {
      return Message.warn(t('등록할 권한이 없습니다.'))
    }
    else
    {
      openPopup("C");
    }
    
  }  
}
const close = (val) =>
{
  if(val=='Y')
  { 
    onButtonsClick({ id: 'btnSearch' });
  }
}

//협력사 알림발송
const beforeSave = async () =>{

  saveParam.value=[];
  let chekedRow = ref([])
  chekedRow = grdMain.value.getGridView().getCheckedRows()

  if(chekedRow.length === 0){
    Message.warn(t('선택한 데이터가 없습니다.'))
    return false
  }
  let paramCheck=true
  let data = ref([])
  for(const val of chekedRow)
  {
    data = grdMain.value.getDataProvider().getJsonRow(val)
    if(data.ALERT_YN=='Y')
    {
      return Message.warn(t(data.KOR_NM + '님에 대해서는 이미 알림을 발송했습니다.'))
    }

    if(!data.IDX_SEQ)
    {
      return Message.warn(t(data.KOR_NM + '님의 현재 건강상태가 입력되어 있지 않습니다.'))
    }
    saveParam.value.push(data)

  };
  // return saveParams.value
  
  return paramCheck
}

const saveData = async () => {
  
  for(let idx = 0; idx<saveParam.value.length; idx++)
  {
    const res = await commonSearchApi({
      queryId: 'HLTKC0050_SEARCH_05',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        VEND_CD: saveParam.value[idx].VEND_CD
      }
    });
    if (res.OUT_EXISTS === '0') {
      Message.warn(t(`${saveParam.value[idx].VEND_NM} 협력사에 권한이 부여되어 있지 않습니다.`));
      return; // saveData 전체 흐름 종료
    }
  }
  
  return commonExecuteApi({
    queryId: 'HLTKC0050_SAVE_03',
    list: saveParam.value,})
    
}

const afterSave = () => {

  let params = {
    userStore: userStore,
    params: saveParam.value,
    mgs: '개인정보관련 알람발송에 대해서 수정 했습니다.',
    crudGbn: 'U', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
  onButtonsClick({ id: 'btnSearch' });
}

const clear = () =>{
  if(!isIp.value) {
    return showNoIp()
  }
  searchParam.VEND_NM = '';
  searchParam.VEND_CD = '';
}

const showNoIp = () => {
  vm.$swal({ title: t('메뉴 사용 권한이 없습니다. 메뉴 사용을 희망하시는 경우\r\n시스템 관리자에게 IP 권한 등록을 요청하시기 바랍니다.\r\n\n☎ 문의처 : 안전보건지원부 보건관리과 T. 3-3022') }).then(res=> {
  })
  return false
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <!-- :button-list="['btnSearch','btnCreate','btnSendAlert']" -->
      <IMenuTitle 
      ref="menuTitle" 
      :title="`${$t(useLogsStore().menuId)}`"
      :button-list="['btnBaseHealthAdd','btnSearch','btnSendAlert']"
      @click-button="onButtonsClick"
      />
      <!-- usePermission  -->
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-select :label="$t('년도')" 
            width="200px" 
            type="YEAR" 
            v-model="searchParam.YEAR"
            > </i-select>
            <i-select :label="$t('분기')" 
            width="200px" 
            type="TEXT" 
            v-model="searchParam.QUARTER" 
            :items="Quarter"
            item-value="COD"
            item-title="TXT"
            > </i-select>
            <i-input
            v-model="searchParam.VEND_NM"
            label-width="50px"
            :label="$t('협력사')"
            width="200px"
            :readonly="true"
          />
          <i-input
            v-model="searchParam.VEND_CD"
            width="150px"
            :clearable="inputClear"
            append-inner-icon="mdi-magnify"
            @click:clearable = "clear"
            @click:appendInner="openVendPopup"
            @keydown.enter="openVendPopup"
            :readonly="true"
          >
          </i-input>
          </div>
        </v-sheet>
        <v-sheet height="100%">
          <v-sheet style="height:100%">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps1.gridViewOption"
              :keys="grdMainProps1.keys" 
              :fields="grdMainProps1.fields"
              :columns="grdMainProps1.columns"
              :column-layout="grdMainProps1.columnLayout"
              @onCellDblClicked="onCellDblClicked"
              @onCurrentChanged="onCurrentChanged"
              @onCellItemClicked="onCellItemClicked" 
            >
            </RealGrid>
          </v-sheet>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <VendTreePopup ref="vendTreePopup" @selected="selectedVend"/>
  <HLTKC0050Popup01 ref="HLTKC0050Popup_01" @closed="close"/>
  <HLTKC0050Popup02 ref="HLTKC0050Popup_02"/>
  <HLTKC0050Popup03 ref="HLTKC0050Popup_03" @after-search="close"/>
  <!-- <HLTKC0050Popup02 ref="HLTKC0050Popup_02"/> -->
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
