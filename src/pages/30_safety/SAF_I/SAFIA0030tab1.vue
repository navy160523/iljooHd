 <!-- SAFIA0030 사내 협력사 현황 -->
 <!-- SI2팀 김성근 작업 -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import DeptPopup from '@/components/popup/DeptPopup.vue'

import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import SendMailPopup from '@/components/popup/SendMailPopup.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import { isEmpty } from "@/@core/utils"
import dayjs from 'dayjs'

 
const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어


const NOBSNS = ref(true)
const grdMain = ref(null)
const MailPopup = ref(null)
const menuTitle = ref(null)
const codeList = reactive({})

const SearchParam = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  WORK_DATE : dayjs().add(-1,'day').format('YYYY-MM-DD')
});

// 초기값세팅
onMounted(() => {
  Promise.all([
    commonSearchApi({
      queryId: "searchBSNS",
      param: { CMPNY_DIV: SearchParam.CMPNY_DIV, USE_DIV: "N" },
    }),

  ]).then((res) => {
    codeList.BSNS_CD = res[0].ORESULT_CUR;
    codeList.BSNS_CD.unshift({ BSNS_NM: "전체", BSNS_CD: "" });
  });

  grdMain.value.getGridView().filterPanel.visible = true
});



// 사업부 변경감지
watch(
  () => SearchParam.BSNS_CD,
  (newValue) => {
    if (!newValue) {
      NOBSNS.value = true;
      SearchParam.DEPT_CD = "";
    } else {
      commonSearchApi({
        queryId: "searchDept3",
        param: { CMPNY_DIV: SearchParam.CMPNY_DIV, BSNS_CD: newValue },
      }).then((res) => {
        SearchParam.DEPT_CD = "";
        codeList.DEPT_CD = res.ORESULT_CUR;
        codeList.DEPT_CD.unshift({ DEPT_NM: "전체", DEPT_CD: "" });
        NOBSNS.value = false;
      });
    }
  }
);

// 그리드
const grdProps1 = reactive({
  gridViewOption: { edit: { editable: false }, checkBar: { visible: true } },
  keys: ["NM1", "PRNT_SAGO_SN", "SAGO_SN"],
  fields: [
    {
      fieldName: "BSNS_NM",
      header: { text: t("사업부") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "text",
      editable: false,
    },

    {
      fieldName: "DEPT_NM",
      header: { text: t("관리부서") },
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "ASGN_CD",
      dataType: "text",
      header: { text: t("업체코드") },
      editable: false,
    },
    {
      fieldName: "ASGN_NM",
      dataType: "text",
      header: { text: t("사업체명") },
      editable: false,
      styleName: "left-column",
    },
    {
      fieldName: "OWNER_NM",
      dataType: "text",
      header: { text: t("대표자") },
      editable: false,
    },
    {
      fieldName: "SOJANG",
      dataType: "text",
      header: { text: t("소장") },
      editable: false,
    },
    {
      fieldName: "CHONGMU",
      dataType: "text",
      header: { text: t("총무") },
      editable: false,
    },

    {
      fieldName: "SAFETY_MANAGER",
      dataType: "text",
      header: { text: t("안전관리") },
      editable: false,
    },
    {
      fieldName: "TEL_NO",
      dataType: "text",
      header: { text: t("연락처") },
      editable: false,
    },
    {
      fieldName: "OPEN_YMD",
      header: { text: t("사업개시일") },
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      editable: false,
    },
    {
      fieldName: "UP_JONG",
      dataType: "text",
      header: { text: t("업종") },
      editable: false,
    },
    {
      fieldName: "SCM_CNT",
      dataType: "text",
      header: { text: t("등록인원") },
      editable: false, 
      styleName: "right-column",
    },
    {
      fieldName: "EMP_CNT",
      dataType: "text",
      header: { text: t("출입인원") },
      editable: false,
      styleName: "right-column",
    },
    {
      fieldName: "CMPNY_DIV",
      dataType: "text",
      header: { text: t("사업장") },
      editable: false,
      visible:false,
    },
    {
      fieldName: "E_MAIL",
      dataType: "text",
      header: { text: t("EMAIL") },
      editable: false,
      visible:false,
    },
    {
      fieldName: "BSNS_CD",
      dataType: "text",
      header: { text: t("BSNS_CD") },
      editable: false,
      visible:false,
    },
  ],
  columns: [],
  columnLayout: [
    "BSNS_NM",
    "DEPT_NM",
    "ASGN_CD",
    "ASGN_NM",
    "OWNER_NM",
    "SOJANG",
    "CHONGMU",
    "SAFETY_MANAGER",
    "TEL_NO",
    "OPEN_YMD",
    "UP_JONG",
    {
      name: "근로자수",
      direction: "horizontal",
      items: [
        "SCM_CNT",
        "EMP_CNT"
      ],
      header: {
        text: t("근로자수"),
      },
    },
  ],
 
});
grdProps1.columns = grdProps1.fields;


const onButtonsClick =(btn)=>{
  if (btn.id === "btnSearch") {
  new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData01)
      .setAfter(afterSearch01)
      .showMessage(true)
      .run();
  } else if(btn.id === 'btnSendMail') {
    transMail()
  }
}
// 조회
const searchData01 = (idx) => {
  if(!SearchParam.WORK_DATE){
    return Message.warn(t('근로자수 기준일은 필수 입력입니다.'))
  }
  let searchParams = {}
  for(let i in SearchParam){
    searchParams[i] = SearchParam[i] 
    }
    searchParams.WORK_DATE = dayjs(searchParams.WORK_DATE).format('YYYYMMDD')
  return commonSearchApi({ queryId: "SAFIA0030_search01", param: searchParams })
}

const afterSearch01 = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

// 메일 전송
const transMail = () => {
  let mailForm = {  
    TO_EMP_NO: [],
    TO_EMP_NM: [],
    BSNS_CD: [],
    ASGN_CD: [],
    REG_DATE: [],
  }
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true) 

  if (checkedRows.length === 0) {
    return Message.err("선택된 데이터가 없습니다.")
  }

  for (let rowIdx of checkedRows) {

    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)

    if(isEmpty(data.E_MAIL)) {
      Message.err(data.ASGN_NM + "는 대표 메일이 없습니다. 확인바랍니다.")
    }
    else {
      mailForm.TO_EMP_NO.push(data.E_MAIL)
      mailForm.TO_EMP_NM.push(data.ASGN_NM)
      mailForm.BSNS_CD.push(data.BSNS_CD)
      mailForm.ASGN_CD.push(data.ASGN_CD)
      mailForm.REG_DATE.push(data.OPEN_YMD)
    }
  }
  
  MailPopup.value.openPopup(mailForm)
}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-0 mt-3 mr-3">
      <IGridTitle
        ref="menuTitle"
        :button-list="['btnSearch', 'btnSendMail']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <v-sheet class="d-flex flex-column fill-height">
        <VForm ref="searchArea" class="searchArea d-flex">
          <i-select
          :label="$t('사업부')"
          width="200px"
          margin="10px"
          placeholder="사업부"
          v-model="SearchParam.BSNS_CD"
          :items="codeList.BSNS_CD"
          item-value="BSNS_CD"
          item-title="BSNS_NM"
        />
        <i-select
          :label="$t('부서')"
          width="240px"
          margin="10px"
          placeholder="부서"
          v-model="SearchParam.DEPT_CD"
          :items="codeList.DEPT_CD"
          item-value="DEPT_CD"
          item-title="DEPT_NM"
          :disabled="NOBSNS"
        />
        <i-input
          :label="$t('근로자수 기준일')"
          width="250px"
          type="Date"
          margin="10px"
          v-model="SearchParam.WORK_DATE"
          required
        />
        <v-checkbox
          style="margin-top: 3px;"
         :label="$t('생산/지원부서만 조회')"   
         v-model="SearchParam.DEPT_GBN"         
          true-value="B"
          false-value="A"
          />
        </VForm>
        <v-sheet class="mb-3" height="75%">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdProps1.gridViewOption"
            :keys="grdProps1.keys"
            :fields="grdProps1.fields"
            :columns="grdProps1.columns"
            :column-layout="grdProps1.columnLayout"
          />
        </v-sheet>
      </v-sheet>
      <!-- 조회조건 -->
      <!-- 메인그리드 -->
    </v-card-text>
  </v-card>
  <SendMailPopup ref="MailPopup" />
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 180px + 13px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>

