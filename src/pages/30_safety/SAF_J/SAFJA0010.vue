<!--
  화면명 : 단기공사 승인(부서용)
  화면개요 : 단기공사 승인(부서용) 조회 관리
  최종수정일자: 2024-05-03
  작성자: 김우빈
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n";
import IMenuTitle from "@/components/IMenuTitle.vue";
import IGridTitle from "@/components/IGridTitle.vue";
import ILabel from "@/components/ILabel.vue";
import RealGrid from "@/components/RealGrid.vue";
import queryFlowHelper from "@/utils/searchFlowHelper";
import { commonSearchApi, commonExecuteApi, getCompanyList } from '@hiway/api/commonApi'
import { yearMonthDay } from '@/utils/common.js'

import SAFJA0010Popup01 from "@/pages/30_safety/SAF_J/SAFJA0010Popup01.vue"
import SAFJA0040Popup04 from "./SAFJA0040Popup04.vue"
import SAFJA0040Popup05 from '@/pages/30_safety/SAF_J/SAFJA0040Popup05.vue'

defineOptions({
  name: "30_safety-SAF_J-SAFJA0010",
})

onMounted(() => {
  initCodeList()
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t; //다국어
const menuTitle = ref(null)
const grd1 = ref(null)

const SAFJA0010Pop01 =ref(null)
const SAFJA0040Pop01 = ref(null)
const SAFJA0040Pop05 = ref(null)

const vendPopup = ref(null)

const grdProps1 = reactive({
  fields: [
    { fieldName: "WORK_NO",editable:false, dataType: "text", header: { text: t("공사번호") } },
    { fieldName: "VND_NAME",editable:false, dataType: "text", header: { text: t("협력회사") } },
    { fieldName: "WORK_DESC",editable:false, dataType: "text", header: { text: t("공사명") }, styleName: 'left-column', },
    { fieldName: "WORK_DT",editable:false, dataType: "text", header: { text: t("공사기간") } },
    { fieldName: "IN_PERSON",editable:false, dataType: "text", header: { text: t("출입인원") } },
    { fieldName: "STATUS_NAME", editable: false, dataType: "text", header: { text: t("진행상태") } },
    { fieldName: "STATUS",visible:false, dataType: "text", header: { text: t("진행상태") } },
    { fieldName: "UNQUI_DESC",editable:false, dataType: "text", header: { text: t("반려사유") } },
    { fieldName: "BIZ_REG_NO",visible:false, dataType: "text", header: { text: t("") } },
    { fieldName: "VEND_CD",visible:false, dataType: "text", header: { text: t("") } },
    { fieldName: "WORK_NO_ORI",visible:false, dataType: "text", header: { text: t("") } },
    { fieldName: "REV_NO", visible: false, dataType: "text", header: { text: t("") } },
    { fieldName: "CMPNY_DIV", visible: false, dataType: "text", header: { text: t("") } },
    
  ],
  
  columns: [],
});
grdProps1.columns = grdProps1.fields;

const initCodeList = () => {
  Promise.all([
    getCompanyList(), //회사 조회
    commonSearchApi({
      queryId: "SAFJA0010_SEARCH_02",
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    })
  ]).then((res) => {  
    if (res.length > 0) {
      codeList.company = res[0].ORESULT_CUR
      codeList.company.unshift({TXT: '' , COD: ''}) 
      codeList.status = res[1].ORESULT_CUR
      codeList.status.unshift({TXT: '전체' , COD: ''})  

      //의뢰부서 초기값 로그인 계정 정보에서 가져옴.
      searchParams.CMPNY_DIV = userStore.cmpnyDiv
      searchParams.START_DT = yearMonthDay(-7)
      searchParams.END_DT = yearMonthDay(7)


      //진행상태 초기값
      searchParams.STATUS = ''
    }
  })
}


const open_manager_info = () => {

  SAFJA0040Pop05.value.openPopup()

}



//코드리스트
const codeList = reactive({
  company: [],
  status: [],
})

//
const searchParams = reactive({
  CMPNY_DIV: '',
  START_DT: '',
  END_DT: '',
  VEND_NM: '',
  VEND_CD: '',
  STATUS: '',
  BIZ_REG_NO: '',
})

//조회 버튼 Event
const onButtonsClick = btn => { 
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grd1])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  }
}

// 조회로직
const searchData = () => {

  const acdtParms = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    USER_ID: userStore.userId,//userStore.userId,'BP16992'
    WORK_FROM_DT: searchParams.START_DT.replaceAll('-',''),
    WORK_TO_DT: searchParams.END_DT.replaceAll('-',''),
    VEND_CD: searchParams.VEND_CD,
    STATUS: searchParams.STATUS,
    BSNS_CD: '',
    DEPT_CD: '',
    REL_ASGN_CD: '',
    DANGER: '',
    REF_ASGN_CD: '',
    REF_CFM_CHK: '',
    DAYS30OVER: '',
    PART_CD2: '',
  }

  //단기공사 조회
  return commonSearchApi({
    queryId: 'SAFJA0010_SEARCH_01',
    param: acdtParms
  })

}
const afterSearch = res => {
  console.log('res', res)
  grd1.value.getDataProvider().setRows(res.ORESULT_CUR);
}

const openPopup = () => {
  vendPopup.value.openPopup()
}
const onDeptSelected = (row) => {
  console.log('onDeptSelected :: ', row)
  searchParams.VEND_NM = row.VND_NAME
  searchParams.VEND_CD = row.VEND_CD
  searchParams.BIZ_REG_NO = row.BIZ_REG_NO
}


//그리드 cell 더블 클릭 이벤트
const onSubCellDblClicked = (grid, data) => {
  if (data.cellType === 'data') {
    const rowData = grd1.value.getRowData(data.dataRow)
    const getData = {
      CMPNY_DIV: rowData.CMPNY_DIV,
      BIZ_REG_NO: rowData.BIZ_REG_NO,
      VEND_CD: rowData.VEND_CD,
      WORK_NO: rowData.WORK_NO_ORI,
      REV_NO: rowData.REV_NO,
      STATUS: rowData.STATUS
    }
    SAFJA0010Pop01.value.openPopup(getData)
  }
}

const keyUp = () => {
  //회면 조회
  onButtonsClick({id : 'btnSearch'})
}
</script>

<template>
  <v-card class="pa-0 fill-height" @keyup.enter="keyUp()">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        title="단기공사 승인(부서용)"
        :button-list="['btnSearch']"        
        @click-button="onButtonsClick"
      >
      <template #editors><span style="color:#222222">※ 사외 단기공사 및 위험작업 신청/관리 사이트 </span>
        <a href="https://ex-hises.hd.com/" target="_blank" style="color:blue;text-decoration: underline;">https://ex-hises.hd.com/</a>
      </template>
      </IMenuTitle>

    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex pb-2">
            <i-select
              :label="$t('출입신청부서회사')"
              width="255px"
              label-width="100px"
              item-title="TXT"
              item-value="COD"
              :items="codeList.company"
              v-model="searchParams.CMPNY_DIV"
              />
              <i-input
              :label="$t('공사기간')"
              width="255px"
              label-width="80px"
              type="date"
              v-model="searchParams.START_DT"
              />
              <i-input
              :label="$t('~')"
              width="160px"
              type="date"
              v-model="searchParams.END_DT"
              />
              <i-input
              :label="$t('협력회사')"
              width="255px"
              label-width="80px"
              v-model="searchParams.VEND_NM"
              readonly
              />
              <i-input
              :label="$t('')"
              width="160px"
              append-inner-icon="mdi-magnify" 
              @click:appendInner="openPopup()"
              v-model="searchParams.VEND_CD"
              readonly
              />
            <i-select
              :label="$t('진행상태')"
              width="255px"
              label-width="80px"
              item-title="TXT"
              item-value="COD"
              :items="codeList.status"
              v-model="searchParams.STATUS"
            />
          </div>
        </v-sheet>
        <v-sheet class = "d-flex justify-end">
          <v-btn @click="open_manager_info"> 15일 이상 단기공사 출입증 발급 담당자 정보 </v-btn>
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
              @onCellDblClicked="onSubCellDblClicked"
            />
          </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
<SAFJA0010Popup01 ref="SAFJA0010Pop01" @selected="onButtonsClick({id : 'btnSearch'})" :btnGubun="'0'"/>
<SAFJA0040Popup04 ref="vendPopup" @selected="onDeptSelected"/>
<!-- 15일 이상 공사 연락처 팝업 -->
<SAFJA0040Popup05 ref="SAFJA0040Pop05" />

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
