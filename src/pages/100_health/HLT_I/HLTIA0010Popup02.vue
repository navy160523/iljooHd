<script setup>
import IGridTitle from "@/components/IGridTitle.vue"
import { ref, defineProps, computed } from "vue";
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import { useUserStore } from '@hiway/stores/user'
import queryFlowHelper from '@/utils/searchFlowHelper'
import RealGrid from '@/components/RealGrid.vue'

const dialog = ref(false)
const menuTitle = ref(null)
const BSNS_CD = ref("");
const DEPT_CD = ref("");
const ASGN_CD = ref("");
const userStore = useUserStore()
const organizationData = ref([]);
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const grdMain = ref(null)

// const searchParam = ref({
//   CMPNY_DIV: userStore.cmpnyDiv,
//   BSNS_CD: "",
//   DEPT_CD: ""
// });

// const openPopup2 = (bsns, dept, asgn, fullNm) => {
const openPopup2 = (allData) => {
  // console.log("all", allData)
  // BSNS_CD.value = bsns;  // 부모에서 전달된 사업부 코드 저장
  // DEPT_CD.value = dept;  // 부모에서 전달된 부서 코드 저장
  // ASGN_CD.value = asgn   // 소속코드
  // searchParams.value.BSNS_CD = bsns;
  // searchParams.value.DEPT_CD = dept;
  dialog.value = true;

  // console.log(BSNS_CD.value);
  // console.log(DEPT_CD.value);
  // console.log(ASGN_CD.value);

  // initCodeList(bsns, dept, asgn, fullNm);
  initCodeList(allData);
}
const closePopup = () => {
  dialog.value = false;
}

const initCodeList = allData => {
  // console.log("all", allData)

  const data = allData.map(item => ({
    DIV_CD: item.DIV_CD === '부서장' ? '부서장' : divCdMapping[item.DIV_CD],  // 숫자 코드 -> 한글 변환
    EMP_NM: item.EMP_NM || "-",
    JOB_TIT_NM: item.JOB_TIT_NM || "-",
    DEPT_NM: item.DEPT_NM || "-",
    // DEPT_NM: fullNm || "-",
    ROLE: roleMapping[item.DIV_CD === '부서장' ? '0' : item.DIV_CD],
    IS: false
  }));

  // console.log("data", data)

  grdMain.value.getDataProvider().setRows(data)
}

// const initCodeList = async (bsnsCd, deptCd, asgnCd, fullNm) => {
//   new queryFlowHelper(vm, t)
//     .setGridList([grdMain])
//     .setQuery(() => searchData01(bsnsCd, deptCd, asgnCd, fullNm)) // 함수 형태로 전달
//     .setAfter(afterSearch01) // 검색 결과를 적용하는 함수 지정
//     .run();
// }

// const searchData01 = async (bsnsCd, deptCd, asgnCd, fullNm) => {
//   const res1 = await commonSearchApi({ 
//     queryId: 'HLTIA0010_SEARCH_02', 
//     param: {
//       CMPNY_DIV: userStore.cmpnyDiv,
//       BSNS_CD: bsnsCd,
//       DEPT_CD: deptCd,
//       ASGN_CD: asgnCd
//     }
//   })

//   const res2 = await commonSearchApi({
//     queryId: 'HLTIA0010_SEARCH_04',
//     param: {
//       CMPNY_DIV: userStore.cmpnyDiv,
//       BSNS_CD: bsnsCd,
//       DEPT_CD: deptCd,
//       ASGN_CD: asgnCd,
//       USER_DIV: 'A'
//     }
//   });

//   // console.log("res1", res1)
//   // console.log("res2", res2)

//   afterSearch01(res1, res2, fullNm);
// }

// const afterSearch01 = (res1, res2, fullNm) => {
//   const data1  = res1.ORESULT_CUR.map(item => ({
//     DIV_CD: divCdMapping[item.DIV_CD],  // 숫자 코드 -> 한글 변환
//     EMP_NM: item.EMP_NM || "-",
//     JOB_TIT_NM: item.JOB_TIT_NM || "-",
//     // DEPT_NM: item.DEPT_NM || "-",
//     DEPT_NM: fullNm || "-",
//     ROLE: roleMapping[item.DIV_CD],
//     IS: false
//   }));

//     const data2 = res2.ORESULT_CUR.map(item => {
//     return {
//       ...item,
//       // DIV_CD: divCdMapping['0'],
//       DIV_CD: '부서장',
//       ROLE: "간사 및 추진위원 선임 및 운영 전반 관리",
//       // DEPT_NM: item.ASGN_FULL_NM,
//       DEPT_NM: fullNm,
//       EMP_NM: item.KOR_NM,
//       IS: true
//     };
//   });

//   const merged = [...data2, ...data1];

//   const transformedData = merged.sort((a, b) => {
//     // data2 먼저, 그 다음 DIV_CD 기준 정렬
//     if (a.IS && !b.IS) return -1;
//     if (!a && b) return 1;
//     return Number(a.DIV_CD) - Number(b.DIV_CD);
//   });
//   // console.log("after데이터", transformedData)
//   grdMain.value.getDataProvider().setRows(transformedData)
// }


defineExpose({
  openPopup2,
})


const onButtonsClick = (btn) => {
  if (btn.id === "btnClose") {
    closePopup()
  }
}

//그리드 속성셋팅 ( 운영조직 세부사항 )
const grdMainProps = reactive({
  gridViewOption : { stateBar: { visible: false } },
  keys : [],
  fields : [ 
    { fieldName: 'DIV_CD', dataType: 'text', width: '80', header: { text: t('구분') }, editable: false },
    { fieldName: 'EMP_NM', dataType: 'text', width: '80', header: { text: t('성명') }, editable: false },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', width: '100', header: { text: t('직위') }, editable: false },
    { fieldName: 'DEPT_NM', dataType: 'text', width: '180', header: { text: t('과/팀') }, editable: false },
    { fieldName: 'ROLE', dataType: 'text', width: '650', header: { text: t('역할') }, editable: false, styleName: 'left-column' },
  ],
  columns : [],
})
grdMainProps.columns = grdMainProps.fields

const divCdMapping = {
  "0": "부서장",
  "1": "간사(정)",
  "2": "간사(부)",
  "3": "대의원",
  // "4": "추천인",
  "5": "추진위원"
};
const roleMapping = {
  "0": "간사 및 추진위원 선임 및 운영 전반 관리",
  "1": "유해요인조사 주관, 결과 취합 및 전산등록, 작업환경개선 및 교육현황 관리 등 적절한 조치가 취해지고 있는지 관리",
  "2": "유해요인조사 주관, 결과 취합 및 전산등록, 작업환경개선 및 교육현황 관리 등 적절한 조치가 취해지고 있는지 관리",
  "3": "유해요인조사의 전반적인 운영 내용 검토하고 의견 제시",
  // "4": "대의원과 같이 전반적인 운영 내용을 검토하고 의견 제시",
  "5": "근골격계 부담작업 선정(11개 법적 항목 근거), 유해요인조사 수행 및 개선방안 검토, 의학적 관리를 위한 조치 및 교육"
};



</script>

<template>
<v-dialog
    v-model="dialog"
    eager
    persistent
    width="980"
    class="p-absolute user-select-none"
  >
  <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5 cursor-move"
    >
    <span>조직도 확인하기</span>
    </v-sheet>

    <v-card class="pa-0 fill-height rounded-b-5">
      <v-card-title class="pa-4 pb-2">
        <!-- 닫기버튼 -->
        <IGridTitle
          ref="menuTitle"
          :button-list="['btnClose']"
          @click-button="onButtonsClick"
        />
      </v-card-title>

      <v-card-text>
        <div class="d-flex flex-column fill-height">
        <v-window class="h-window">
          <v-window-item>
            <!-- h-grow : 컨텐츠를 가로로 놓고싶다면 v-sheet 아래에 div와 클래스를 지정해주세요 
                바로 <div class="h-grow"> 부터 시작한다면 컨텐츠는 자동으로 지정됩니다.
            -->
            <div class="h-grow">
                <v-sheet width="100%" class="pa-0 h-auto">
                <!-- <IGridTitle
                  :button-list="['btnClose']"
                  @click-button="onButtonsClick"
                >
                </IGridTitle> -->
                <!-- 메인그리드 -->
                <RealGrid
                  ref="grdMain"
                  :grid-view-option="grdMainProps.gridViewOption"
                  :keys="grdMainProps.keys" 
                  :fields="grdMainProps.fields"
                  :columns="grdMainProps.columns"
                  style="height: 300px;"
                />
              </v-sheet>
            </div>
          </v-window-item>
        </v-window>
      </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style lang="scss">
  .tableW {
    width: 80px;
  }

  .tableWh {
    width: 140px;
  }

  .tableWd {
    width: 560px;
  }
</style>
