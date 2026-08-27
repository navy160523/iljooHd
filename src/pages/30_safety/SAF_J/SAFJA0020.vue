<!--
  화면명 : 단기공사 회사 조회
  화면개요 : 단기공사 회사 조회
  최종수정일자: 2024-04-23
  작성자: 김우빈
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from "vue-i18n";
import IMenuTitle from "@/components/IMenuTitle.vue";
import RealGrid from "@/components/RealGrid.vue";
import Message from '@hiway/utils/notify'

import { commonSearchApi, commonExecuteApi} from '@hiway/api/commonApi'
import queryFlowHelper from "@/utils/searchFlowHelper";
import saveFlowHelper from '@/utils/saveFlowHelper'
import SAFJA0020Popup01 from "./SAFJA0020Popup01.vue"
import { email_regx, phone_regx } from "@/utils/common";
import { isEmpty } from "lodash-es";

defineOptions({
  name: "SAFJA0020",
});

onMounted(() => {
});

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t; //다국어
const menuTitle = ref(null);
const userStore = useUserStore()
const grd1 = ref(null);

const SAFJA0020Pop01 = ref(null)

//조회 파라미터 
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  VND_NAME: '',
  REP_NAME: '',               //사업부
  BIZ_REG_NO: ''
})

//v-model value
const setModelValue = reactive({
  BIZ_KIND: '',
  BIZ_REG_NO: '',
  BIZ_REG_NO_DISP: '',
  CMPNY_DIV: '',
  EXPIRATION_DATE: '',
  EXPIRATION_USER_ID: '',
  GROUP_INSR_NO: '',
  INJR_INSR_NO: '',
  PIC_BIRYMD: '',
  PIC_EMAIL: '',
  PIC_JOB_TIT: '',
  PIC_MOBILE: '',
  PIC_NAME: '',
  PIC_BIRYMD2: '',
  PIC_EMAIL2: '',
  PIC_JOB_TIT2: '',
  PIC_MOBILE2: '',
  PIC_NAME2: '',
  REP_BIRYMD: '',
  REP_EMAIL: '',
  REP_MOBILE: '',
  REP_NAME: '',
  USER_COUNT: '',
  USE_YN: '',
  VEND_ADDR: '',
  VEND_CD: '',
  VEND_FAX_NO: '',
  VEND_TELNO: '',
  VND_NAME: '',
})

//그리드 세팅
const grdProps1 = reactive({
  fields: [
    { fieldName: "VND_NAME", dataType: "text", header: { text: t("협력사명") }, styleName: "left-column", editable: false },
    { fieldName: "BIZ_REG_NO_DISP", dataType: "text", header: { text: t("사업자번호") },editable: false },
    { fieldName: "REP_NAME", dataType: "text", header: { text: t("대표자명") },editable: false },
    { fieldName: "BIZ_KIND", dataType: "text", header: { text: t("주업종") }, styleName: "left-column",editable: false },
    { fieldName: "USER_COUNT", dataType: "text", header: { text: t("등록인원") },editable: false },
    { fieldName: "PIC_NAME", dataType: "text", header: { text: t("담당자1") }, editable: false },
    { fieldName: "PIC_NAME2", dataType: "text", header: { text: t("담당자2") }, editable: false },

    { fieldName: "CMPNY_DIV", dataType: "text", header: { text: t("") }, visible:false },
    { fieldName: "PIC_MOBILE", dataType: "text", header: { text: t("") }, visible: false },
    { fieldName: "PIC_MOBILE2", dataType: "text", header: { text: t("") },visible: false },
    { fieldName: "VEND_ADDR", dataType: "text", header: { text: t("") }, visible: false },
    { fieldName: "VEND_TELNO", dataType: "text", header: { text: t("") }, visible:false },
    { fieldName: "VEND_FAX_NO", dataType: "text", header: { text: t("") }, visible:false },
    { fieldName: "GROUP_INSR_NO", dataType: "text", header: { text: t("") }, visible:false },
    { fieldName: "INJR_INSR_NO", dataType: "text", header: { text: t("") }, visible: false },
    { fieldName: "PIC_EMAIL", dataType: "text", header: { text: t("") }, visible: false },
    { fieldName: "PIC_EMAIL2", dataType: "text", header: { text: t("") }, visible:false },
    { fieldName: "EXPIRATION_DATE", dataType: "text", header: { text: t("") }, visible: false },
    { fieldName: "EXPIRATION_USER_ID", dataType: "text", header: { text: t("") }, visible: false },
    { fieldName: "PIC_BIRYMD", dataType: "text", header: { text: t("") }, visible: false },
    { fieldName: "PIC_JOB_TIT", dataType: "text", header: { text: t("") }, visible: false },
    { fieldName: "PIC_BIRYMD2", dataType: "text", header: { text: t("") }, visible: false },
    { fieldName: "PIC_JOB_TIT2", dataType: "text", header: { text: t("") }, visible: false },
    { fieldName: "REP_EMAIL", dataType: "text", header: { text: t("") }, visible: false },
    { fieldName: "REP_MOBILE", dataType: "text", header: { text: t("") }, visible: false },
    { fieldName: "USE_YN", dataType: "text", header: { text: t("") }, visible: false },
    { fieldName: "VEND_CD", dataType: "text", header: { text: t("") }, visible: false },    
    { fieldName: "BIZ_REG_NO", dataType: "text", header: { text: t("") }, visible: false },    
  ],
  columns: [],
});
grdProps1.columns = grdProps1.fields;

//조회 버튼 Event
const onButtonsClick = btn => { 
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grd1])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } else if (btn.id === 'btnUpdate') {
    new saveFlowHelper(vm, t)
      .setBefore(beforeSave)
      .setQuery(saveData)
      .setAfter(() => { onButtonsClick({ id :'btnSearch' }) })
      .run()
    
  }
}

// 조회로직
const searchData = () => {
  
  const acdtParms = {}
  acdtParms.CMPNY_DIV=searchParams.CMPNY_DIV
  acdtParms.VND_NAME=searchParams.VND_NAME
  acdtParms.REP_NAME= searchParams.REP_NAME
  acdtParms.BIZ_REG_NO= searchParams.BIZ_REG_NO

  return commonSearchApi({
    queryId: 'SAFJA0020_SEARCH_01',
    param: acdtParms
  })

}
const afterSearch = res => {
  grd1.value.getDataProvider().setRows(res.ORESULT_CUR);
}
//저장로직
const beforeSave = () => {
  return true
}
const saveData = () => {
  const param = []
  console.log('setModelValue ', setModelValue)

  if (!phone_regx(setModelValue.PIC_MOBILE)) {
    return Message.warn(t('담당자1 핸드폰 형식이 잘못되었습니다.'))
  }

  if (!email_regx(setModelValue.PIC_EMAIL)) {
    return Message.warn(t('담당자1 이메일 형식이 잘못되었습니다.'))
  }

  if (!isEmpty(setModelValue.PIC_MOBILE2) && !phone_regx(setModelValue.PIC_MOBILE2)) {
    return Message.warn(t('담당자2 핸드폰 형식이 잘못되었습니다.'))
  }

  if (!isEmpty(setModelValue.PIC_EMAIL2) && !email_regx(setModelValue.PIC_EMAIL2)) {
    return Message.warn(t('담당자2 이메일 형식이 잘못되었습니다.'))
  }

  //
  param.push({
    CMPNY_DIV: setModelValue.CMPNY_DIV,
    BIZ_REG_NO: setModelValue.BIZ_REG_NO,
    VEND_CD: setModelValue.VEND_CD,
    PIC_NAME: setModelValue.PIC_NAME,
    PIC_JOB_TIT: setModelValue.PIC_JOB_TIT,
    PIC_MOBILE: setModelValue.PIC_MOBILE,
    PIC_EMAIL: setModelValue.PIC_EMAIL,
    PIC_NAME2: setModelValue.PIC_NAME2,
    PIC_JOB_TIT2: setModelValue.PIC_JOB_TIT2,
    PIC_MOBILE2: setModelValue.PIC_MOBILE2,
    PIC_EMAIL2: setModelValue.PIC_EMAIL2,
    USE_YN: setModelValue.USE_YN,
    USER_ID: userStore.userId,
  })
  return commonExecuteApi({ queryId: "SAFJA0020_SAVE_01", list: param })
}

//그리드 cell 클릭 이벤트
const onSubGrdCellClicked = (grid, clickData) => { 
  
  //cell 클릭 그리드 빈곳 선택시 예외 처리
  if (clickData.cellType === 'gridEmpty') {
    return
  }
  console.log('clickData ', clickData)
  const data2 = grd1.value.getDataProvider().getJsonRow(clickData.itemIndex)

  console.log('data2 ', data2)

  setModelValue.BIZ_KIND = data2.BIZ_KIND
  setModelValue.BIZ_REG_NO = data2.BIZ_REG_NO
  setModelValue.BIZ_REG_NO_DISP = data2.BIZ_REG_NO_DISP
  setModelValue.CMPNY_DIV = data2.CMPNY_DIV
  setModelValue.EXPIRATION_DATE = data2.EXPIRATION_DATE
  setModelValue.EXPIRATION_USER_ID = data2.EXPIRATION_USER_ID
  setModelValue.GROUP_INSR_NO = data2.GROUP_INSR_NO
  setModelValue.INJR_INSR_NO = data2.INJR_INSR_NO
  setModelValue.PIC_BIRYMD = data2.PIC_BIRYMD
  setModelValue.PIC_EMAIL = data2.PIC_EMAIL
  setModelValue.PIC_JOB_TIT = data2.PIC_JOB_TIT
  setModelValue.PIC_MOBILE = data2.PIC_MOBILE
  setModelValue.PIC_NAME = data2.PIC_NAME
  setModelValue.PIC_BIRYMD2 = data2.PIC_BIRYMD2
  setModelValue.PIC_EMAIL2 = data2.PIC_EMAIL2
  setModelValue.PIC_JOB_TIT2 = data2.PIC_JOB_TIT2
  setModelValue.PIC_MOBILE2 = data2.PIC_MOBILE2
  setModelValue.PIC_NAME2 = data2.PIC_NAME2
  setModelValue.REP_BIRYMD = data2.REP_BIRYMD
  setModelValue.REP_EMAIL = data2.REP_EMAIL
  setModelValue.REP_MOBILE = data2.REP_MOBILE
  setModelValue.REP_NAME = data2.REP_NAME
  setModelValue.USER_COUNT = data2.USER_COUNT
  setModelValue.USE_YN = data2.USE_YN
  setModelValue.VEND_ADDR = data2.VEND_ADDR
  setModelValue.VEND_CD = data2.VEND_CD
  setModelValue.VEND_FAX_NO = data2.VEND_FAX_NO
  setModelValue.VEND_TELNO = data2.VEND_TELNO
  setModelValue.VND_NAME = data2.VND_NAME

}
//그리드 cell 더블 클릭 이벤트
const onSubCellDblClicked = (grid, data) => {
  if (data.cellType === 'data') {
    const rowData = grd1.value.getRowData(data.dataRow)
    const getData = {
      CMPNY_DIV: searchParams.CMPNY_DIV,
      USER_ID:  userStore.userId,
      WORK_FROM_DT: '',
      WORK_TO_DT: '',
      VEND_CD: rowData.VEND_CD,
      STATUS: '',
      BSNS_CD: '',
      DEPT_CD: '',
      REL_ASGN_CD: '',
      DANGER: '',
      REF_ASGN_CD: '',
      REF_CFM_CHK: '',
      DAYS30OVER: '',
      PART_CD2: '',

      VND_NAME: rowData.VND_NAME,
      REP_NAME: rowData.REP_NAME,
      BIZ_REG_NO_DISP: rowData.BIZ_REG_NO_DISP
    }
    SAFJA0020Pop01.value.openPopup(getData)
  }
}

</script>

<template>
  <div>
    <v-card class="pa-0 fill-height">
      <v-card-title class="pa-3 pb-0">
        <IMenuTitle
          ref="menuTitle"
          title="단기공사 회사 조회"
          :button-list="['btnSearch','btnUpdate']"
          @click-button="onButtonsClick"
        />
      </v-card-title>
      <v-card-text class="pa-3 pt-0 content-area">
        <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea">
            <div class="d-flex pb-2">
              <i-input
                  :label="$t('협력회사명')"
                  required
                  margin="10px"
                  width="255px"
                  label-width="80px"
                  v-model="searchParams.VND_NAME"
                  @keydown.enter="onButtonsClick({ id: 'btnSearch' })"
                />
              <i-input
                  :label="$t('대표자명')"
                  required
                  margin="10px"
                  width="255px"
                  label-width="80px"
                  v-model="searchParams.REP_NAME"
                  @keydown.enter="onButtonsClick({ id: 'btnSearch' })"
                />
              <i-input
                  :label="$t('사업자번호')"
                  required
                  margin="10px"
                  width="255px"
                  label-width="80px"
                  v-model="searchParams.BIZ_REG_NO"
                  @keydown.enter="onButtonsClick({ id: 'btnSearch' })"
                />
            </div>
          </v-sheet>
          <div class="h-auto">
            <v-sheet class="h-auto">
              
              <RealGrid
                ref="grd1"
                class="mt-1"
                :grid-view-option="grdProps1.gridViewOption"
                :keys="grdProps1.keys"
                :fields="grdProps1.fields"
                :columns="grdProps1.columns"
                :column-layout="grdProps1.columnLayout"
                @onCellClicked="onSubGrdCellClicked"
                @onCellDblClicked="onSubCellDblClicked"
                />

            </v-sheet>
              <!-- 상세정보 -->
            <IGridTitle class="mt-1" title="상세정보"/>
            <v-sheet class="searchArea">
              <div class="d-flex mt-2">
                <div class="d-flex flex-column" style="flex-basis:40%">
                  <div class="d-flex pb-2">
                    <i-input
                      topLabel disabled
                      :label="$t('사업자등록번호')"
                      class="mx-5"
                      label-width="100px" 
                      width="200px" 
                      v-model="setModelValue.BIZ_REG_NO_DISP"
                      />
                    <div class="d-flex flex-column"  style="width:180px">
                      <span class="mr-2 formLabelText" style="width:100px">
                          {{$t('사용여부')}}
                        </span>
                      <v-radio-group inline
                        v-model="setModelValue.USE_YN"
                      >
                        <v-radio label="사용" value="Y"></v-radio>
                        <v-radio label="미사용" value="N"></v-radio>
                      </v-radio-group>
                    </div>
                  </div>
                  <div class="d-flex pb-2">
                    <i-input
                      topLabel disabled
                      :label="$t('협력회사명')"
                      class="mx-5"
                      label-width="100px" 
                      width="420px" 
                      v-model="setModelValue.VND_NAME"

                      />
                      <i-input
                      topLabel disabled
                      :label="$t('회사전화')"
                      class="mr-1"
                      label-width="100px" 
                      width="200px" 
                      v-model="setModelValue.VEND_TELNO"
                      />
                  </div>

                  <div class="d-flex pb-2">
                    <i-input
                      topLabel disabled
                      :label="$t('주업종')"
                      class="mx-5"
                      label-width="100px" 
                      width="420px" 
                      v-model="setModelValue.BIZ_KIND"
                      />
                      <i-input
                      topLabel disabled
                      :label="$t('회사FAX')"
                      class="mr-1"
                      label-width="100px" 
                      width="200px" 
                      v-model="setModelValue.VEND_FAX_NO"
                      />
                  </div>

                  <div class="d-flex pb-2">
                    <i-input
                      topLabel disabled
                      :label="$t('회사주소')"
                      class="mx-5"
                      label-width="100px" 
                      width="640px" 
                      v-model="setModelValue.VEND_ADDR"
                      />
                  </div>

                  <div class="d-flex pb-2">
                    <i-input
                      topLabel disabled
                      :label="$t('산재보험No.')"
                      class="mx-5"
                      label-width="100px" 
                      width="200px" 
                      v-model="setModelValue.INJR_INSR_NO"
                      />
                      <i-input
                      topLabel disabled
                      :label="$t('단체보상보험No.')"
                      class="mr-1"
                      label-width="100px" 
                      width="200px" 
                      v-model="setModelValue.GROUP_INSR_NO"
                      />
                  </div>
                </div>
                <div class="d-flex flex-column" style="flex-basis:60%">

                  <div class="d-flex pb-2">
                  <i-input
                    topLabel disabled
                    :label="$t('대표자 성명')"
                    class="mx-5"
                    label-width="100px" 
                    width="290px" 
                    v-model="setModelValue.REP_NAME"
                    />
                    <i-input
                    topLabel disabled
                    :label="$t('대표자 핸드폰')"
                    class="mr-1"
                    label-width="100px" 
                    width="200px" 
                    v-model="setModelValue.REP_MOBILE"
                    />
                    
                  </div>
                  <div class="d-flex pb-2">
                    <i-input
                      topLabel disabled
                      :label="$t('대표자 E-Mail')"
                      class="mx-5"
                      label-width="100px" 
                      width="290px" 
                      v-model="setModelValue.REP_EMAIL"
                      />
                  </div>

                  <div class="d-flex pb-2">
                    <i-input
                      topLabel
                      :label="$t('담당자1 직급/성명')"
                      class="ml-5 mr-1"
                      label-width="110px" 
                      width="80px" 
                      v-model="setModelValue.PIC_JOB_TIT"
                      />
                      <i-input
                      topLabel
                      :label="$t(' ')"
                      class="ml-1 mr-5"
                      width="200px" 
                      v-model="setModelValue.PIC_NAME"
                      />
                      <i-input
                      topLabel
                      :label="$t('담당자1 핸드폰')"
                      class="mr-1"
                      label-width="100px" 
                      width="200px" 
                      v-model="setModelValue.PIC_MOBILE"
                      number
                      maxlength="15"
                      />

                      <i-input
                      topLabel
                      :label="$t('담당자2 직급/성명')"
                      class="ml-5 mr-1"
                      label-width="110px"
                      width="80px" 
                      v-model="setModelValue.PIC_JOB_TIT2"
                      />
                      <i-input
                      topLabel
                      :label="$t(' ')"
                      class="ml-1 mr-5"
                      width="200px" 
                      v-model="setModelValue.PIC_NAME2"
                      />
                      <i-input
                      topLabel
                      :label="$t('담당자2 핸드폰')"
                      class="mr-1"
                      label-width="100px" 
                      width="200px" 
                      v-model="setModelValue.PIC_MOBILE2"
                      number
                      maxlength="15"
                      />


                  </div>

                  <div class="d-flex pb-2">

                    <i-input
                      topLabel
                      :label="$t('담당자1 E-Mail')"
                      class="mx-5"
                      label-width="100px" 
                      width="290px" 
                      v-model="setModelValue.PIC_EMAIL"
                      />
                      
                      

                      <i-input
                      style="margin-left: 222px !important;"
                      topLabel
                      :label="$t('담당자2 E-Mail')"
                      label-width="100px" 
                      width="290px" 
                      v-model="setModelValue.PIC_EMAIL2"
                      />
                  </div>
                </div>
              </div>
            </v-sheet>
          </div>          
        </div>

      </v-card-text>
    </v-card>
  </div>
  <SAFJA0020Popup01 ref="SAFJA0020Pop01" />
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
