<!--     일주지앤에스 SI2팀 장필구    -->
<!--  프로그램명 : MSDS 찾기   -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { useLogsStore } from "@hiway/stores/logs";
import { useUserStore } from "@hiway/stores/user";
import { useI18n } from "vue-i18n";
import { commonSearchApi, getCompanyList } from "@hiway/api/commonApi";
import IMenuTitle from "@/components/IMenuTitle.vue";
import RealGrid from "@/components/RealGrid.vue";
import queryFlowHelper from "@/utils/searchFlowHelper";
import HLTDA0010PopUp01 from "@/pages/100_health/HLT_D/HLTDA0010PopUp01.vue" // 리스트 클릭
import HLTDA0010PopUp02 from "@/pages/100_health/HLT_D/HLTDA0010PopUp02.vue" // 유틸리티 라인 MSDS
import HLTDA0010PopUp03 from "@/pages/100_health/HLT_D/HLTDA0010PopUp03.vue" // 작업 공정별 관리 요령
import HLTDA0010PopUp04 from "@/pages/100_health/HLT_D/HLTDA0010PopUp04.vue" // 저장 및 수정
import HLTDA0010PopUp05 from "@/pages/100_health/HLT_D/HLTDA0010PopUp05.vue" // 화학물질 규제 기준 확인
import HLTDA0010PopUp06 from "@/pages/100_health/HLT_D/HLTDA0010PopUp06.vue" // 화학물질 취급 안내 자료
import PdfView from "@/pages/99_indexPopUp/PdfViewPopup.vue"
import dayjs from "dayjs";
import Message from "@hiway/utils/notify";

defineOptions({
  name: "100_health-HLT_D-HLTDA0010",
});

const vm = getCurrentInstance().proxy; //다이얼로그관련
const t = useI18n().t; //다국어
const userStore = useUserStore();
const isAdmin = ref(false);
const menuTitle = ref(null);
const grdMain = ref(null);
const hltda0010PopUp01 = ref(null);
const hltda0010PopUp02 = ref(null);
const hltda0010PopUp03 = ref(null);
const hltda0010PopUp04 = ref(null);
const hltda0010PopUp05 = ref(null);
const hltda0010PopUp06 = ref(null);
const pdfPopup = ref(null)

// 조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  GUBN: "",
  GUBN_NM: "",
  SYN: "N", // 날짜 조회 여부 -- 로딩이 길어서 기본적으로 체크
  SDATE: dayjs().subtract(14, "DAY").format("YYYY-MM-DD"),
  EDATE: dayjs().format("YYYY-MM-DD"),
});

// 조회 조건 구분 셀렉트 박스 값
const codeList = reactive({
  CMPNY: [],
  GUBN: [
    { COD: "", TXT: "전체" },
    { COD: "A", TXT: "자재번호" },
    { COD: "B", TXT: "MSDS명" },
    { COD: "C", TXT: "제품명" },
    { COD: "D", TXT: "납품사" },
    { COD: "E", TXT: "CAS 명/번호" },
  ],
});

/*  공통코드 세팅 */
onMounted(() => {
  // admin 부여
  if ( useLogsStore().isMenuAdmin === "Y" || userStore.authGrpCd.includes('HLTD001') || userStore.authGrpCd.includes("GRP00372"))
    isAdmin.value = true;

  onButtonsClick({ id: "btnSearch" });
  grdMain.value.getGridView().filterPanel.visible = true;

  initCodeList()
});

const initCodeList = () => {
  console.log('initcodelist')
  Promise.all([
    getCompanyList()
  ]).then(res => {
    codeList.CMPNY = res[0].ORESULT_CUR
  })
}

//그리드 속성셋팅
const grd1Props = reactive({
  gridViewOption: { checkBar: { visible: true }, edit: { editable: true } },
  keys: [],
  fields: [
    {
      fieldName: "MATNO",
      header: { text: t("자재번호") },
      width: "150",
      styleName: "left-column",
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "MATDSC",
      header: { text: t("제품명") },
      width: "150",
      styleName: "left-column",
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "TYPE_ID",
      header: { text: t("Type") },
      width: "50",
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "MSDS_NM",
      header: { text: t("MSDS명") },
      width: "150",
      styleName: "left-column",
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "REVNO_DT",
      header: { text: t("개정일자") },
      // width: "150",
      // styleName: "editable_column left-column",
      // dataType: "text",
      // dataType: "datetime",
      //  datetimeFormat: "yyyy-MM-dd",
      editable: false,
    },
    {
      fieldName: "RECDATE",
      header: { text: t("입고일자") },
      // width: "150",
      // styleName: "editable_column left-column",
      // dataType: "text",
      // dataType: "datetime",
      // datetimeFormat: "yyyy-MM-dd",
      editable: false,
    },
    {
      fieldName: "VNDNME",
      header: { text: t("납품사") },
      width: "150",
      styleName: "left-column",
      dataType: "text",
      editable: false,
    },
    {
      fieldName: "SAUPBU_NM",
      header: { text: t("사업부") },
      width: "150",
      styleName: "left-column",
      dataType: "text",
      editable: false,
    },
    // 2025.10.31 속도 문제로 규제 정보 삭제
    // {
    //   header: { text: t("규제 정보") },
    //   name: "EXTINFO",
    //   fieldName: "EXTINFO",
    //   width: "150",
    //   editable: false,
    //   renderer: {
    //     type: "html",
    //     callback: function (grid, cell) {
    //       const value = cell.value || "";
    //       const colorMap = {
    //         금지: "#FF0000",
    //         사고: "#800080",
    //         제한: "#800080",
    //         유독: "#800080",
    //         특별: "#800080",
    //         허용: "#DAA520",
    //         관리: "#DAA520",
    //       };
    //       const htmlParts = value.split(",").map(item => {
    //         const char = item.trim();
    //         const color = colorMap[char] || "black";
    //         return `<span style="color:${color}; font-weight:bold;">${char}</span>`;
    //       });
    //       return htmlParts.join(" ");
    //     }
    //   }
    // },
    {
      fieldName: "MSDS_FILEID_DSC",
      header: { text: t("MSDS 보기") },
      width: "100",
      // styleName: "editable_column left-column",
      dataType: "text",
      editable: false,
      renderer: {
        type: "button"
      }
    },
    // 안보이는거
    { fieldName: 'CMPNY_DIV', dataType: 'text', header: { text: t('회사') },visible: false, },
    { fieldName: 'MSDS_FILEID', dataType: 'text', header: { text: t('파일아이디') }, visible: false, },
    { fieldName: 'VNDCOD', dataType: 'text', header: { text: t('납품사코드') }, visible: false, },
    { fieldName: 'SAUPBU', dataType: 'text', header: { text: t('사업부코드') }, visible: false, },
    // { fieldName: 'TYPE_ID', dataType: 'text', header: { text: t('타입') }, visible: false, },
    { fieldName: 'REVNO', dataType: 'text', header: { text: t('리비전') }, visible: false, },
    { fieldName: 'GRP_DIV', dataType: 'text', header: { text: t('용도구분') }, visible: false, },
    { fieldName: 'PROD_VNDCOD', dataType: 'text', header: { text: t('제조사정보') }, visible: false, },
    { fieldName: 'DIVISION', dataType: 'text', header: { text: t('자료구분') }, visible: false, },
    { fieldName: 'REMARK', dataType: 'text', header: { text: t('규제물질포함에 대한 비고내용') }, visible: false, },
    { fieldName: 'CONTENT_DT', dataType: 'text', header: { text: t('내용 개정일자') }, visible: false, },
    { fieldName: 'GRVTY', dataType: 'text', header: { text: t('제품비중(Gravity)') }, visible: false, },
    // { fieldName: 'SAVE_YN', dataType: 'text', header: { text: t('저장여부') },visible: false, },
  ],
  columns: [],
});

grd1Props.columns = grd1Props.fields;

// 메뉴버튼
const onButtonsClick = (btn) => {
  if (btn.id === "btnSearch") {
    getData();
  }
  else if (btn.id === "btnCreate") {
    let chekedRow = ref([])
    let data = ref([])
    // let bCheck = true
    chekedRow = grdMain.value.getGridView().getCheckedRows()
    if(chekedRow.length === 0){

    } else {
      if (chekedRow.length === 1) {
        chekedRow.forEach(val => {
        data = grdMain.value.getDataProvider().getJsonRow(val)
        })
      } else {
        Message.warn(t("자재번호 1개만 선택 하십시요."));
        return
      }
    }
    // console.log('data : ' , data)
    hltda0010PopUp04.value.openPopup(data)
  }
  else if (btn.id === "btnUtilityLineMSDS") {
    hltda0010PopUp02.value.openPopup('1')
  }
  else if (btn.id === "btnWorkProcessManagementTips") {
    hltda0010PopUp03.value.openPopup('1')
  }
  //wkdvlfrn
  // 'btnRegulatoryStandards',
  //       'btnHandlingGuide',
  else if (btn.id === "btnRegulatoryStandards") {
    hltda0010PopUp05.value.openPopup('1')
  }
  else if (btn.id === "btnHandlingGuide") {
    hltda0010PopUp06.value.openPopup('1')
  }
};
const getData = () => {
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .showMessage(true)
    .run();
};

//  조회
const searchData = () => {
  return commonSearchApi({
    queryId: "HLTDA0010_SEARCH_01",
    param: searchParams,
  });
};

grdMain.onItemChecked = function (grdMain, itemIndex, checked) {
    addLog("onItemChecked: " + itemIndex + ", " + checked);
};

// 조회 후
const afterSearch = (res) => {
  // grdMain.value.setBindingColumn("HALF_DIV", codeList.HALF_DIV, "COD", "TXT");
  // console.log('res : ', res.ORESULT_CUR)
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR);
};

const onCellDblClicked = (grid, data) => {
  // if (data.cellType === "data") {
     let row = grdMain.value.getDataProvider().getJsonRow(data.dataRow)
     hltda0010PopUp01.value.openPopup(row)
  // }
}

const onCellClicked = (grid, clickData) => {
  if (clickData.cellType === "data" && clickData.column === "MSDS_FILEID_DSC") {
    let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
    // console.log('data MSDS_FILEID     : ' , data.MSDS_FILEID )
    // console.log('data MSDS_FILEID_DSC : ' , data.MSDS_FILEID_DSC )
    if(data.MSDS_FILEID_DSC == null || data.MSDS_FILEID_DSC == '') {
       return
    } else {
      // console.log('data 0010 : ' ,data)
      pdfPopup.value.openMSDSPopup(data, 'HLTDA0020_SEARCH_08')
      // vm.$swal({
      //   title: t('MSDS 파일을 열거나 다운로드 받으시겠습니까?'),
      //   html: `<button id="downloadBtn" style="margin-right: 10px;">${t('다운로드')}</button>
      //         <button id="openBtn">${t('열기')}</button>`,
      //   showCancelButton: true,
      //   showConfirmButton: false, // 기본 확인 버튼 숨김
      //   didOpen: () => {
      //     // 다운로드 버튼 클릭 이벤트
      //     document.getElementById('downloadBtn').addEventListener('click', () => {
      //       commonDownloadFilesApi(data.MSDS_FILEID)
      //         .then((res) => {
      //           //2023.11.30 박용훈 백단에서 FileUtils.fileDownload 를 사용하는것으로 바꾸어서 변경함.
      //           const file = res.contentDisposition.split('fileName="')
      //           const blob = new Blob([res])
      //           const link = document.createElement('a')
      //           link.href = URL.createObjectURL(blob)
      //           //2023.11.30 박용훈 백단에서 FileUtils.fileDownload 를 사용하는것으로 바꾸어서 변경함.
      //           // 2023.12.08 박용훈 파일명을 다시 디코딩 해줘야함.
      //           link.download = decodeURI(file[1].replace('";', ''))
      //           link.click()
      //           URL.revokeObjectURL(link.href)
      //         })
      //         .catch((e) => {
      //           console.error('파일 다운로드 중 오류 발생',e)
      //         })
      //     });
      //     // // 열기 버튼 클릭 이벤트
      //     document.getElementById('openBtn').addEventListener('click', () => {
      //       commonDownloadFilesApi(data.MSDS_FILEID)
      //         .then((res) => {
      //           //2023.11.30 박용훈 백단에서 FileUtils.fileDownload 를 사용하는것으로 바꾸어서 변경함.
      //           const file = res.contentDisposition.split('fileName="')
      //           const blob = new Blob([res])
      //           const blobUrl = URL.createObjectURL(blob)
      //           //2023.11.30 박용훈 백단에서 FileUtils.fileDownload 를 사용하는것으로 바꾸어서 변경함.
      //           // 2023.12.08 박용훈 파일명을 다시 디코딩 해줘야함.
      //           const decodedFileName = decodeURI(file[1].replace('";', ''))
      //           window.open(blobUrl, '_blank')
      //           URL.revokeObjectURL(blobUrl)
      //         })
      //         .catch((e) => {
      //           console.error('파일 여는 중 오류 발생',e)
      //         })
      //     });
      //   },
      // });
    }
  }
}
const onPopupClosedPopUp04 = () => {
  // console.log('자식 팝업 닫힘 → 데이터 조회 실행')
  onButtonsClick({ id: 'btnSearch' })
}

const onPopupSavePopUp04 = () => {
  // console.log('자식 팝업 저장 → 데이터 조회 실행')
  onButtonsClick({ id: 'btnSearch' })
}
</script>

<template>
  <v-card class="pa-0 fill-height">
    <!-- 타이틀 -->
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle ref="menuTitle" :title="$t(useLogsStore().menuId)" :button-list="[
        'btnSearch',
        'btnCreate',
        'btnRegulatoryStandards',
        'btnHandlingGuide',
        'btnUtilityLineMSDS',
        'btnWorkProcessManagementTips'
      ]" @click-button="onButtonsClick" />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select v-model="searchParams.CMPNY_DIV" :label="$t('회사구분')" :items="codeList.CMPNY" 
            item-value="COD" item-title="TXT" width="250px" label-width="50px" />
          <i-select v-model="searchParams.GUBN" :label="$t('구분')" label-width="50px" :items="codeList.GUBN"
            item-value="COD" item-title="TXT" width="200px" />
          <i-input v-model="searchParams.GUBN_NM" width="200px" type="Text" margin="30px" />
          <v-checkbox v-model="searchParams.SYN" true-value="Y" false-value="N" />
          <i-input v-model="searchParams.SDATE" width="200px" :label="$t('입고일자')" type="date" margin="30px" />
          <i-input v-model="searchParams.EDATE" label-width="30px" width="200px" :label="$t('~')" type="date" />
        </v-sheet>
        <v-sheet class="h-auto">
          <RealGrid ref="grdMain"
             class="mt-2"
             :grid-view-option="grd1Props.gridViewOption"
             :keys="grd1Props.keys"
             :fields="grd1Props.fields"
             :columns="grd1Props.columns"
             @onCellDblClicked="onCellDblClicked"
            @onCellClicked="onCellClicked"
          />
        </v-sheet>
      </div>
      <!-- 팝업존 -->
      <HLTDA0010PopUp01 ref="hltda0010PopUp01"/><!-- 제품 상세 정보 -->
      <HLTDA0010PopUp02 ref="hltda0010PopUp02"/><!-- 유틸리티 라인 MSDS -->
      <HLTDA0010PopUp03 ref="hltda0010PopUp03"/><!-- 작업 공정별 관리 요령 -->
      <HLTDA0010PopUp04 ref="hltda0010PopUp04" @closed="onPopupClosedPopUp04" @save="onPopupSavePopUp04"/><!-- 저장 및 수정 -->
      <HLTDA0010PopUp05 ref="hltda0010PopUp05"/><!-- 화학물질 규제 기준 확인 -->
      <HLTDA0010PopUp06 ref="hltda0010PopUp06"/><!-- 화학물질 취급 안내 자료 -->
      <PdfView ref="pdfPopup"/>
    </v-card-text>
  </v-card>
</template>
  
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;

  >div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}

</style>