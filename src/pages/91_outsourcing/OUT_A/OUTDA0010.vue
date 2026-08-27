<!--
  화면명 : 구역별 안전요원 현황
  화면개요 : 구역별 안전요원 현황 조회
  최종수정일자: 2024-04-26
  작성자: 김우빈
-->
<script setup>
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from '@hiway/stores/logs'
import { commonSearchApi,commonExecuteApi,getCodeList } from "@hiway/api/commonApi";
import { useI18n } from "vue-i18n"
import RealGrid from '@/components/RealGrid.vue'
import { ref, onMounted } from 'vue'
import { yearMonthDay } from "@/utils/common"
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import LocationPopup from "@/components/popup/LocationPopup.vue";
defineOptions({
  name: '91_outsourcing-OUT_A-OUTDA0010',
})

const menuTitle = ref(null)
const userStore = useUserStore();
const t = useI18n().t; //다국어
const grdMain = ref('')
const grdSub = ref('')

const locationPopup = ref(null);

const btnListM = ref([
    {
      id: 'search',
      text: '조회',
      type: 'light',
    }
  ]
)

onMounted(() => {
  initCodeList()
})

const codeList = reactive({
  dataList1: [],  //회사구분
  dataList2: [],  //사업부
  dataList3: [],  //부문
  dataList4: [],  //부문
})


//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    //사업부
    commonSearchApi({ queryId: 'SEARCH_SHIP', param: { CMPNY_DIV: '', GBN: '5', SEARCH: '' } }),

    getCodeList('HHIZ010A'), 

  ]).then(res => {
    codeList.dataList1 = res[0].ORESULT_CUR
    codeList.dataList1.unshift({ SHIP_NM: '전체', WORK_NO: '' })
    grdSub.value.setBindingColumn("SHIP_NO", res[0].ORESULT_CUR, "WORK_NO", "SHIP_NM")
  })
}


const popupParam = reactive({
  SaveData: {},
})

const searchParam = reactive({
  BASE_DATE: yearMonthDay(),
  BASE_DATE2: yearMonthDay(),
  CMPNY_DIV: userStore.cmpnyDiv,
  WK_LMPLC: '',
  WK_MMPLC: '',
  WK_SMPLC: '',
  WK_LPLC: '',
  WK_MPLC: '',
  WK_SPLC: '',
  SHIP_NO: '',
  WK_PLC: ''
})

const searchData = async () => {
  commonSearchApi({
    queryId: "OUTDA0010_SEARCH_01",
    param: {
      BASE_DT: searchParam.BASE_DATE.replaceAll('-', '')
      , WK_LPLC: searchParam.WK_LPLC
      , WK_MPLC: searchParam.WK_MPLC
      , WK_SPLC: searchParam.WK_SPLC
    },
  }).then(res => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}

const searchData2 = async () => {
  commonSearchApi({
      queryId: "OUTDA0010_SEARCH_02",
      param: {
          CMPNY_DIV: searchParam.CMPNY_DIV
        , BASE_DT: searchParam.BASE_DATE2.replaceAll('-','')
        , SHIP_NO: searchParam.SHIP_NO
      },
  }).then((res) => { 
    grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
}

//초기 그리드 page값
const page = ref({
  default:1,
  maxLength:1
})

const mainBtnClick = (e) => { 
  if (e.id === 'search') {
    searchData()
  }
}

const subBtnClick = (e) => { 
  if (e.id === 'search') {
    searchData2()
  }
}

const selectedLocation = (row) => {

  searchParam.WK_LMPLC = row[0].TXT;
  searchParam.WK_MMPLC = row[1].TXT;
  searchParam.WK_SMPLC = row[2].TXT;

  searchParam.WK_LPLC = row[0].COD;
  searchParam.WK_MPLC = row[1].COD;
  searchParam.WK_SPLC = row[2].COD;
};



//콤보 체인지 value 테스트
const changeCombo = e => {
  // search01(e)
}

//
const openPopup = gbn => {
  if (gbn === '장소조회') {
    locationPopup.value.openPopup(userStore.cmpnyDiv);
  }
}

const clear = () => {
  searchParam.WK_LMPLC = '';
  searchParam.WK_MMPLC = '';
  searchParam.WK_SMPLC = '';

  searchParam.WK_LPLC = '';
  searchParam.WK_MPLC = '';
  searchParam.WK_SPLC = '';
}

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    // checkBar: { visible: !props.gridOnly },
  },
  keys: [],
  fields: [
  {
      fieldName: "WK_LPLC",
      dataType: "text",
      header: { text: '장소 대구분' },
      editable: false,
    },
    {
      fieldName: "WK_MPLC",
      dataType: "text",
      header: { text: '장소 중구분' },
      editable: false,
    },
    {
      fieldName: "WK_SPLC",
      dataType: "text",
      header: { text: '장소' },
      editable: false,
    },
    {
      fieldName: "REL_DEPT_CD",
      dataType: "text",
      header: { text: "안전부" },
      editable: false,
    },
    {
      fieldName: "REL_TEAM_CD",
      dataType: "text",
      header: { text: "안전팀" },
      editable: false,
    },
    {
      fieldName: "REL_GWA_CD",
      dataType: "text",
      header: { text: "안전과" },
      editable: false,
    },
    {
      fieldName: "REL_EMP_NM",
      dataType: "text",
      header: { text: "안전요원" },
      visible: true,
      editable: false,
    },
    {
      fieldName: "TRS",
      dataType: "text",
      header: { text: "무전기코드" },
      visible: true,
      editable: false,
    },
    {
      fieldName: "SHIP_NO",
      dataType: "text",
      header: { text: "호선번호" },
      visible: true,
      editable: false,
    },
    {
      fieldName: "HND_PHN",
      dataType: "text",
      header: { text: "휴대폰" },
      visible: false,
      editable: false,
    },
    {
      fieldName: "CMPNY_DIV",
      dataType: "text",
      header: { text: "CMPNY_DIV" },
      visible: false,
      editable: false,
    },
    {
      fieldName: "INSERT_USER_ID",
      dataType: "text",
      header: { text: "INSERT_USER_ID" },
      visible: false,
      editable: false,
    },
    
    {
      fieldName: "WK_DT",
      dataType: "text",
      header: { text: "WK_DT" },
      visible: false,
      editable: false,
    },
    {
      fieldName: "LOC_HEARDER_NO",
      dataType: "text",
      header: { text: 'LOC_HEARDER_NO' },
      visible: false,
      editable: false,
    },
    {
      fieldName: "REL_EMP_NO",
      dataType: "text",
      header: { text: 'REL_EMP_NO' },
      visible: false,
      editable: false,
    },
    {
      fieldName: "LOC_HEADER_NM",
      dataType: "text",
      header: { text: 'LOC_HEADER_NM' },
      visible: false,
      editable: false,
    },
  ],
  columns: [],
});
grdMainProps.columns = grdMainProps.fields;

const grdMainProps2 = reactive({
  gridViewOption: {
    stateBar: { visible: false },
    // checkBar: { visible: !props.gridOnly },
  },
  keys: [],
  fields: [
    {
      fieldName: "SHIP_NO",
      dataType: "text",
      header: { text: "호선" },
      editable: false,
      lookupDisplay: true,
      editor: { type: 'list', textReadOnly: true, dropDownWhenClick: true }
    },
    {
      fieldName: "REL_DEPT_CD",
      dataType: "text",
      header: { text: "안전부" },
      editable: false,
    },
    {
      fieldName: "REL_TEAM_CD",
      dataType: "text",
      header: { text: "안전팀" },
      editable: false,
    },
    {
      fieldName: "REL_GWA_CD",
      dataType: "text",
      header: { text: "안전과" },
      editable: false,
    },
    {
      fieldName: "REL_EMP_NM",
      dataType: "text",
      header: { text: "안전요원" },
      visible: true,
      editable: false,
    },
    {
      fieldName: "TRS",
      dataType: "text",
      header: { text: "무전기코드" },
      visible: true,
      editable: false,
    },
    {
      fieldName: "CMPNY_DIV",
      dataType: "text",
      header: { text: "CMPNY_DIV" },
      visible: false,
      editable: false,
    },
    {
      fieldName: "INSERT_USER_ID",
      dataType: "text",
      header: { text: "INSERT_USER_ID" },
      visible: false,
      editable: false,
    },
    
    {
      fieldName: "WK_DT",
      dataType: "text",
      header: { text: "WK_DT" },
      visible: false,
      editable: false,
    },
    {
      fieldName: "LOC_HEARDER_NO",
      dataType: "text",
      header: { text: 'LOC_HEARDER_NO' },
      visible: false,
      editable: false,
    },
    {
      fieldName: "WK_LPLC",
      dataType: "text",
      header: { text: 'WK_LPLC' },
      visible: false,
      editable: false,
    },
    {
      fieldName: "WK_MPLC",
      dataType: "text",
      header: { text: 'WK_MPLC' },
      visible: false,
      editable: false,
    },
    {
      fieldName: "WK_SPLC",
      dataType: "text",
      header: { text: 'WK_SPLC' },
      visible: false,
      editable: false,
    },
    {
      fieldName: "REL_EMP_NO",
      dataType: "text",
      header: { text: 'REL_EMP_NO' },
      visible: false,
      editable: false,
    },
    {
      fieldName: "LOC_HEADER_NM",
      dataType: "text",
      header: { text: 'LOC_HEADER_NM' },
      visible: false,
      editable: false,
    },
  ],
  columns: [],
});
grdMainProps2.columns = grdMainProps2.fields;


</script>

<template>
<v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
      />
    </v-card-title>
    <!-- <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <IGridTitle :title="$t('장소기준')" :btn-list="btnListM" @btnClick="mainBtnClick"> </IGridTitle>
          <i-card title="장소기준" :btn-list="btnListM" @btnClick="mainBtnClick"></i-card>
        </v-sheet>
      </div>
    </v-card-text> -->
    <!-- <v-row noGutters class="pa-5 justify-center outaa0040 h-100 overflow-auto loginBackgroundGray"> -->
    <!-- 작업인원 등록 및 조회 -->

    <!-- 인원정보 -->
    <i-card title="장소기준"
      :btn-list="btnListM"
      @btnClick="mainBtnClick">
    
      
      <v-card class="bg-base pa-4">
        <div class="d-flex align-center">
          <i-input
          :label="$t('일자')"
          width="240px"
          labelWidth="30px"
          type="date"
          v-model="searchParam.BASE_DATE"
          />
          <i-input
          :label="$t('장소 대구분')"
          width="250px"
          labelWidth="70px"
          class="mr-3"
          v-model="searchParam.WK_LMPLC"
          setBgColor="bgColorWhite"
          disabled
          readonly
          />
          <i-input
          :label="$t('장소 중구분')"
          width="250px"
          labelWidth="70px"
          class="mr-3"
          v-model="searchParam.WK_MMPLC"
          setBgColor="bgColorWhite"
          disabled
          readonly
          />
          <i-input
          :label="$t('장소')"
          width="250px"
          labelWidth="30px"
          class="mr-1"
          append-inner-icon="mdi-magnify" 
          @click:appendInner="openPopup('장소조회')"
          v-model="searchParam.WK_SMPLC"
          setBgColor="bgColorWhite"
          readonly
          />
          <v-btn 
          color="primary"
          @click="clear"
          >
            초기화
          </v-btn>
        </div>
      </v-card>
      <v-card class="px-0 py-2 ">
        <RealGrid
          ref="grdMain"
          style="height: 200px;"
          :grid-view-option="grdMainProps.gridViewOption"
          :keys="grdMainProps.keys"
          :fields="grdMainProps.fields"
          :columns="grdMainProps.columns"
        />
      </v-card>
    </i-card>
    <!-- 상세정보 -->
    <i-card title="호선/프로젝트 기준" 
      :btn-list="btnListM"
      @btnClick="subBtnClick">
      <v-card class="bg-base pa-3">
        <div class="d-flex">
          <i-input
          :label="$t('일자')"
          width="240px"
          labelWidth="30px"
          type="date"
          v-model="searchParam.BASE_DATE2"
          />
          <i-select
          :label="$t('호선')"
          :items="codeList.dataList1"
          v-model="searchParam.SHIP_NO"
          labelWidth="30px"
          width="350px"
          item-value="WORK_NO"
          item-title="SHIP_NM"
          label-width="30px" 
          >
          </i-select>
        </div>
      </v-card>
      <v-card class="px-0 py-2">
        <RealGrid
          ref="grdSub"
          style="height: 200px;"
          :grid-view-option="grdMainProps2.gridViewOption"
          :keys="grdMainProps2.keys"
          :fields="grdMainProps2.fields"
          :columns="grdMainProps2.columns"
        />
      </v-card>
    </i-card>
    <LocationPopup @selectedArr="selectedLocation" ref="locationPopup" />
  <!-- </v-row> -->
</v-card>
  
</template>

<style scoped lang="scss">

</style>
