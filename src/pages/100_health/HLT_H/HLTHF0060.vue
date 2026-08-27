<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed, onBeforeMount } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
} from "@hiway/api/commonApi";
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from "@/utils/saveFlowHelper";
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import HLTHF0060Popup from './HLTHF0060Popup.vue'
import Message from "@hiway/utils/notify";

defineOptions({
  name: '100_health-HLT_H-HLTHF0060',
})

const userLogStore = useLogsStore()
const userStore = useUserStore()
const grdMain = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어

const dataRes = ref();
const isAdmin = ref(0)
const hLTHF0060Popup = ref(null)


const codeList = reactive({
    BSNS_CD : [],
    DEPT_CD : [],
    YN: [
      { TXT: "미확인",    COD: "Y" },
      { TXT: "전체",  COD: "N" },
    ],
})

const readOnly = reactive({
  BSNS_CD : false,
  DEPT_CD : false,
})

const searchParam = reactive({
    CMPNY_DIV : userStore.cmpnyDiv,//사업장코드 
    BSNS_CD : '',
    DEPT_CD : '',
    YN      : 'N'
})

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'BSNS_NM',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('사업부') },
      lookupDisplay: true,
      styleName: 'left-column',
    },
    {
      fieldName: 'DEPT_NM',
      dataType: 'text',
      width: '200',
      editable: false,
      header: { text: t('부서명') },
      lookupDisplay: true,
      styleName: 'left-column',
    },
    {
      fieldName: 'DEPT_CD',
      dataType: 'text',
      width: '60',
      editable: false,
      header: { text: t('부서코드') },
      lookupDisplay: true,
      styleName: 'center-column',
    },
    {
      fieldName: 'EMP_NO_MANAGER',
      dataType: 'text',
      width: '60',
      editable: false,
      styleName: 'center-column',
      header: { text: t('사번') },
    },
    {
      fieldName: 'EMP_NM_MANAGER',
      dataType: 'text',
      width: '60',
      editable: false,
      styleName: 'center-column',
      header: { text: t('이름') },
    },
    {
      fieldName: 'HND_PHN_MANAGER',
      dataType: 'text',
      width: '80',
      editable: false,
      styleName: 'center-column',
      header: { text: t('연락처') },
    },
    {
      fieldName: 'EMP_NO_RECEIVER',
      dataType: 'text',
      width: '60',
      editable: false,
      styleName: 'center-column',
      header: { text: t('사번') },
    },
    {
      fieldName: 'EMP_NM_RECEIVER',
      dataType: 'text',
      width: '60',
      editable: false,
      styleName: 'center-column',
      header: { text: t('이름') },
    },
    {
      fieldName: 'HND_PHN_RECEIVER',
      dataType: 'text',
      width: '80',
      editable: false,
      styleName: 'center-column',
      header: { text: t('연락처') },
    },
    {
      fieldName: 'PLACE_NAME',
      dataType: 'text',
      width: '150',
      editable: false,
      styleName: 'left-column',
      header: { text: t('수령 장소') },
    },
    {
      fieldName: 'UPDATE_DATE',
      dataType: 'text',
      width: '100',
      editable: false,
      styleName: 'center-column',
      header: { 
        text: t('저장 일시\n(최종 저장 일시)'), 
        styleName: 'multiline-editor' 
      },
    },
    {
      fieldName: 'UPDATE_USER_NM',
      dataType: 'text',
      width: '60',
      editable: false,
      styleName: 'center-column',
      header: { 
        text: t('저장 확인\n(저장 확인자)'),
        styleName: 'multiline-editor' 
      },
    },
    {
      fieldName: 'REMARKS',
      dataType: 'text',
      width: '200',
      editable: false,
      styleName: 'left-column',
      header: { text: t('비고') },
    },


    //안보이는컬럼
    {
      fieldName: 'CMPNY_DIV',
      visible: false,
      header: { text: t('사업장구분') },
    },
    {
      fieldName: 'BSNS_CD',
      visible: false,
      header: { text: t('사업부') },
    },
    // {
    //   fieldName: 'DEPT_CD',
    //   visible: false,
    //   header: { text: t('부서') },
    // },
    {
      fieldName: 'ASGN_CD',
      visible: false,
      header: { text: t('조직') },
    },
    {
      fieldName: 'PLACE_CD',
      visible: false,
      header: { text: t('수령장소') },
    },
    {
      fieldName: 'UPDATE_USER_ID',
      visible: false,
      header: { text: t('저장 확인자') },
    },
   
  ],
  columns: [],
  columnLayout: [
    'BSNS_NM',
    'DEPT_NM',
    'DEPT_CD',
    {
        name: '담당자',
        direction: 'horizontal',
        items: ['EMP_NO_MANAGER', 'EMP_NM_MANAGER', 'HND_PHN_MANAGER']
    },
    {
        name: '수령자',
        direction: 'horizontal',
        items: ['EMP_NO_RECEIVER', 'EMP_NM_RECEIVER', 'HND_PHN_RECEIVER']
    },
    'PLACE_NAME',
    'UPDATE_DATE',
    'UPDATE_USER_NM',
    'REMARKS'
  ]
})

grdMainProps.columns = grdMainProps.fields


const initCodeList = async() => {
    Promise.all([
        commonSearchApi({
            queryId: "searchBSNS",
            param: { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: "Y" },
        }), // 사업부
        
    ]).then((res) =>{

        dataRes.value =res

        codeList.BSNS_CD = res[0].ORESULT_CUR;
        codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: ''})

        codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: ''})
    })
}

onBeforeMount(()=>{
  if(userStore.authGrpCd.includes('HLTH001')) isAdmin.value = 2
  else if (userStore.authGrpCd.includes('HLTH002')) isAdmin.value = 1
  else isAdmin.value = 0
})

onMounted(async() => {
  await initCodeList()
  await setDeptList()
  
  if(isAdmin.value === 0){
    searchParam.BSNS_CD = userStore.bsnsCd
    searchParam.DEPT_CD = userStore.deptCd
    readOnly.BSNS_CD = true
    readOnly.DEPT_CD = true
  }else if(isAdmin.value === 2){
    searchParam.BSNS_CD = ''
    searchParam.DEPT_CD = ''
    readOnly.BSNS_CD = false
    readOnly.DEPT_CD = false
  }

  

  //onButtonsClick({ id: 'btnSearch' })
  grdMain.value.getGridView().filterPanel.visible = true

  await nextTick()
})

const onButtonsClick = async (btn) =>{
    if(btn.id === 'btnSearch') {
      new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
    }else if(btn.id === 'btnCreate'){
        hLTHF0060Popup.value.openPopup(isAdmin.value)
    }else if(btn.id === 'btnChk'){
      new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(afterSave)
      .run()
    }else if(btn.id === 'btnDelete'){
      new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
    }
}

const beforeDelete = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))

    return false
  }
  return true
}

const deleteData = () => {
  let deleteParam = []
  let chkNum = grdMain.value.getGridView().getCheckedRows(true)

  for (let i = 0; i < chkNum.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(chkNum[i])
    let deleteData = {
      CMPNY_DIV : data.CMPNY_DIV,
      BSNS_CD   : data.BSNS_CD,
      DEPT_CD   : data.DEPT_CD,
      ASGN_CD   : data.ASGN_CD,
    }

    deleteParam.push(deleteData)
  }

  return commonExecuteApi({
    queryId: 'HLTHF0060_DELETE_01',
    list: deleteParam,
  })
}

const afterDelete = () => {
  onButtonsClick({ id: 'btnSearch' })
}

const beforeSave = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('확인 처리할 데이터를 선택해주세요.'))

    return false
  }
  return true
};

const saveData = async() => {

  let temp = null
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    let saveParam = [{
      CMPNY_DIV : data.CMPNY_DIV,
      BSNS_CD   : data.BSNS_CD,
      DEPT_CD   : data.DEPT_CD,
      ASGN_CD   : data.ASGN_CD,
      USER_ID   : userStore.userId
    }]
    temp = commonExecuteApi({ queryId : 'HLTHF0060_SAVE_CONFIRM', list: saveParam }) 
  }
  return temp
};

const afterSave = (res) => {
  onButtonsClick({ id: 'btnSearch' })
};

const searchData = () => {
  return commonSearchApi({
    queryId: 'HLTHF0060_SEARCH_01',
    param: searchParam
  })
}

const afterSearch = (res) => {
  const gridView = grdMain.value.getGridView();
 
  gridView.setAllCheck(false)
  gridView.checkAll(false)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const updateBsnsCd = async () => {
  await setDeptList()
  onButtonsClick({ id: 'btnSearch' })
}

const setDeptList = async() =>{

    codeList.DEPT_CD = [];
    searchParam.DEPT_CD = ''

    Promise.all([
        commonSearchApi({
            queryId: "searchDept3",
            param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParam.BSNS_CD, USE_DIV: "Y" },
        }), // 부서
    ]).then((res) =>{
        codeList.DEPT_CD = res[0].ORESULT_CUR;
        codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: ''})
    })
}

const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  hLTHF0060Popup.value.openPopup(isAdmin.value, data)
}

const buttonList = computed(() => {
  console.log('aaa : ',isAdmin.value)

  return isAdmin.value > 0
    ? ['btnSearch', 'btnCreate', 'btnChk']
    : ['btnSearch', 'btnCreate']
})

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnDelete']"
        @click-button="onButtonsClick"
        :use-permission="true"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-select
              :label="$t('사업부')"
              :items="codeList.BSNS_CD"
              item-title="BSNS_NM"
              item-value="BSNS_CD"
              width="300px"
              labelWidth="50px"
              v-model="searchParam.BSNS_CD"
              :disabled="readOnly.BSNS_CD"
              @update:modelValue="updateBsnsCd"
            >
              
            </i-select>
            <i-select
              :label="$t('부서')"
              :items="codeList.DEPT_CD"
              item-title="DEPT_NM"
              item-value="DEPT_CD"
              width="300px"
              labelWidth="50px"
              v-model="searchParam.DEPT_CD"
              :disabled="readOnly.DEPT_CD"
              @update:modelValue="onButtonsClick({ id: 'btnSearch' })"
            >
            </i-select>
            <v-checkbox
              v-model="searchParam.YN"
              true-value="Y"
              false-value="N"
              label="미확인"
              @update:modelValue="onButtonsClick({ id: 'btnSearch' })"
            />
          </div>
        </v-sheet>
        <div class="h-grow">
          <v-sheet class="pa-0 h-auto">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCellDblClicked="onCellDblClicked"
            >
            </RealGrid>
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
  <HLTHF0060Popup
    @End="() => onButtonsClick({ id: 'btnSearch' })"
    ref="hLTHF0060Popup"
  ></HLTHF0060Popup>
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