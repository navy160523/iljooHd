<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
  getCompanyList,
  commonRequest,
  commonSendApi,
  commonSendFirebase,
  commonWordExportApi,
} from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import DeptPopup from '@/components/popup/DeptPopup.vue'
import ApprovalPopup from '@/components/popup/ApprovalPopup.vue'
import ImageViewerPopup from '@/components/popup/ImageViewerPopup.vue'
import {
  required,
  passwordValidator,
  confirmedValidator,
  emailValidator,
  lengthValidator,
} from '@hiway/utils/validation'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'
import EmpPopup from '@/components/popup/EmpPopup.vue'
import { getJsonFromExcel } from '@/utils/excel'
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'
import TemplatePopup_01 from '@/pages/00_sample/templatePopup_01.vue'
import SendSMSPopUp from '@/components/popup/SendSMSPopUp.vue'
import SendMailPopup from '@/components/popup/SendMailPopup.vue'
import OZReport from '@/components/OZReport.vue'
import { getQDomain } from '@/utils/common'
import { excelDown } from '@/utils/excel'
import IButtonList from '@/components/IButtonList.vue'
import SYSAA0030_popup01 from '@/pages/90_system/SYS_A/SYSAA0030_popup01.vue'

defineOptions({
  name: '00_sample-template',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어

const appDoc = ref(null)
const menuTitle = ref(null)
const searchArea = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const deptPopup = ref(null)
const empPopup = ref(null)
const approvalPopup = ref(null)
const templatePopup_01 = ref(null)
const newChip = ref('')
const chips = reactive([])
const imageViewerPopup = ref(null)
const sendSMSPopup = ref(null)
const sendMailPopup = ref(null) //메일 발송 팝업
const saveParams= ref([])
const SYSAA0030popup01 = ref(null)

const addChip = () => {
  if (newChip) {
    chips.push(newChip)
    newChip.value = ''
  }
}

const removeChip = (index) => {
  splice(index, 1)
}

//조회조건
let searchParams = reactive({
  REQ_DATE_FROM: dayjs().subtract(1, "month").format("YYYY-MM-DD"),
  REQ_DATE_TO : dayjs().format("YYYY-MM-DD"),
  REQ_EMP_NO: '',
  ACT_EMP_NO: '',
}) 

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, edit: { editable: false } },
  fields: [
    { fieldName: 'REQ_ID', dataType: 'text', header: { text: t('요청번호') } },
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('소속') } },     //요청자
    { fieldName: 'REQ_EMP_NO', dataType: 'text', header: { text: t('성명') } },
    { fieldName: 'REQ_DATE', dataType: 'text', header: { text: t('요청일시') } },
    { fieldName: 'REQ_TITLE', dataType: 'text', header: { text: t('제목') } },
    { fieldName: 'REQ_DESCR', header: { text: t("내용") }, dataType: "text", editable: false, visible: false },
    { fieldName: 'STATUS', dataType: 'text', header: { text: t('진행상태') } },
    { fieldName: 'ACC_CMPNY_DIV', dataType: 'text', header: { text: t('소속') } }, //접수자
    { fieldName: 'ACC_EMP_NO', dataType: 'text', header: { text: t('성명') } },
    { fieldName: 'ACC_DATE', dataType: 'text', header: { text: t('접수/반려일시') } },
    { fieldName: 'ACT_CMPNY_DIV', dataType: 'text', header: { text: t('소속') } }, //조치자
    { fieldName: 'ACT_EMP_NO', dataType: 'text', header: { text: t('성명') } },
    { fieldName: 'START_PLAN_DATE', dataType: 'text', header: { text: t('착수예정일') } },
    { fieldName: 'START_DATE', dataType: 'text', header: { text: t('착수일시') } },
    { fieldName: 'ACT_PLAN_DATE', dataType: 'text', header: { text: t('조치예정일') } },
    { fieldName: 'ACT_DATE', dataType: 'text', header: { text: t('조치일시') } },
    { fieldName: 'REMARK', header: { text: t("반려사유") }, dataType: "text", editable: false, visible: false },

  ],
  columns: [],
  columnLayout: [
    'REQ_ID',
    {
      name: '요청자',
      direction: 'horizontal',
      items: [ 'CMPNY_DIV', 'REQ_EMP_NO' ],
      header: { text: t('요청자') },
    },
    'REQ_DATE',
    'REQ_TITLE',
    'STATUS',
    {
      name: '접수자',
      direction: 'horizontal',
      items: [ 'ACC_CMPNY_DIV', 'ACC_EMP_NO' ],
      header: { text: t('접수자') },
    },
    'ACC_DATE',
    {
      name: '조치자',
      direction: 'horizontal',
      items: [ 'ACT_CMPNY_DIV', 'ACT_EMP_NO' ],
      header: { text: t('조치자') },
    },
    'START_PLAN_DATE',
    'START_DATE',
    'ACT_PLAN_DATE',
    'ACT_DATE',
  ],
})

// 그리드 세팅
grdMainProps.columns = grdMainProps.fields

//초기 데이터셋팅
onMounted(() => {
  //initCodeList()

})

//메뉴버튼
const onButtonsClick = btn => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnNew') {
    SYSAA0030popup01.value.openPopup2()
    
  } 

}

/*메뉴버튼 조회*********************************************/
//필요에 따라 추가
const beforeSearch = async () => {
  return true
}

// 조회로직
const searchData = () => {
  return commonSearchApi({ queryId: 'TSYSAA0030_SEARCH_01', param: searchParams })
}

const afterSearch = (res) => {
  console.log('res', res)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const closePopup = () => {
  onButtonsClick({ id: 'btnSearch' })
}

const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  console.log("data",data)
  SYSAA0030popup01.value.openPopup(data)
}
</script>

<template>
  <v-card class="pa-3 fill-height">
    <v-card-title class="pa-2 py-0">
      <!-- 타이틀 영역 
            타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnNew',]"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- content-area 해당 클래스의 이름은 필수 입니다. 
          다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
    <v-card-text class="pa-2 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea flex-column">
          <div class="d-flex">
            <i-input 
              :label="$t('요청일')" 
              type="date"
              width="190px"
              v-model="searchParams.REQ_DATE_FROM"
              @focusout="dateFrChanged"
              margin="10px"
            />
            <i-input 
              :label="$t('-')" 
              type="date"
              width="170px"
              v-model="searchParams.REQ_DATE_TO"
              @focusout="dateToChanged"
            />
            <i-input 
              :label="$t('요청자')"
              width="200px"
              v-model="searchParams.REQ_EMP_NO"
              append-inner-icon="mdi-magnify" 
              @click:appendInner="openEmpPopup"
              maxlength="500"
            />
            <i-input 
              :label="$t('조치자')"
              width="200px"
              v-model="searchParams.ACT_EMP_NO"
              append-inner-icon="mdi-magnify" 
              @click:appendInner="openEmpPopup"
              korean
              maxlength="500"
            />
          </div>
        </v-sheet>
        <v-sheet class="h-auto">
            <RealGrid
              ref="grdMain"
              :grid-view-option="grdMainProps.gridViewOption"
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCellDblClicked="onCellDblClicked"
            />
        </v-sheet>
      </div>
    </v-card-text>
    <EmpPopup ref="empPopup" @selected="onEmpSelected" />
    <SYSAA0030_popup01 ref="SYSAA0030popup01" @closePopup="closePopup"></SYSAA0030_popup01>
  </v-card>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>


