<!--
  화면명 : 장비자격 보수교육 현황
  화면개요 : 장비자격 보수교육 현황을 확인할 수 잇는 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from "@hiway/stores/user"
import { useI18n } from "vue-i18n"
import { commonSearchApi } from "@hiway/api/commonApi"
import queryFlowHelper from '@/utils/searchFlowHelper'
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import { commonSampleDownFilesApi } from '@hiway/api/commonFileApi'

defineOptions({
  name: "60_edu-EDU_B-EDUBA0060",
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const firstLock = ref(0)
// GRP00413(장비자격모듈관리자) 또는 admin 그룹은 부서 변경가능
const isAdmin = ref(null)

const searchParams = reactive({
  CMPNY_DIV : userStore.cmpnyDiv, //회사 구분
  BSNS_CD : userStore.bsnsCd,     //사업부
  DEPT_CD : userStore.deptCd,     //부서
  EMP_NO : '',                    //사번
  EMP_NM : '',                    //성명
})

const codeList = reactive({
  BSNS_CD : [],
  DEPT_CD : [],
})


// 개월 수 계산 (일자까지 반영)
function getMonthDiff(baseDate, targetDate) {
  let months = (targetDate.getFullYear() - baseDate.getFullYear()) * 12;
  months += targetDate.getMonth() - baseDate.getMonth();

  // targetDate의 일이 baseDate의 일보다 작으면 개월수 1감소
  if (targetDate.getDate() < baseDate.getDate()) {
    months -= 1;
  }

  return months;
}

// 스타일 콜백 함수 생성
const createEduStyleCallback = (eduGroup) => {
  return (grid, dataCell) => {
    const rowIndex = dataCell.index.dataRow;
    const rowData = grid.getValues(rowIndex);
    const baseDateStr = rowData[`EDU_DATE${eduGroup}`];

    if (!baseDateStr) return;

    const baseDate = new Date(baseDateStr);
    const today = new Date();

    const monthPassed = getMonthDiff(baseDate, today);

    let styleName = '';
    if (monthPassed >= 15) {
      // 15개월 이상일 때 국가자격 값 존재 여부 체크
      const nationalQual = rowData[`CANCEL${eduGroup}_OUT`];
      if (nationalQual) {
        styleName = 'orange-cell';  // 국가자격 있으면 주황
      } else {
        styleName = 'gray-cell';    // 없으면 회색
      }
    } else if (monthPassed >= 13) {
      styleName = 'orange-cell';
    } else if (monthPassed >= 10) {
      styleName = 'yellow-cell';
    } else {
      return; // 스타일 없음 (흰색)
    }

    return { styleName };
  };
};

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption: {
    edit: { editable: false }
  },
  keys: [],
  fields: [
    { fieldName: 'ASGN_FULL_NM', dataType: 'text', header: { text: t('소속') }, width: '250', styleName: 'left-column' },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', header: { text: t('직위') }, width: '80', },
    { fieldName: 'EMP_NO', dataType: 'text', header: { text: t('사번') }, width: '80', },
    { fieldName: 'EMP_NM', dataType: 'text', header: { text: t('이름') } },

      // 교육1
    { fieldName: 'EDU_DATE1', dataType: 'text', header: { text: t('수료일') }, styleCallback: createEduStyleCallback(1) },
    { fieldName: 'EDU_DATE_STOP1', dataType: 'text', header: { text: t('정지일') }, styleCallback: createEduStyleCallback(1) },
    { fieldName: 'CANCEL1_IN', dataType: 'text', header: { text: t('사내자격') }, styleCallback: createEduStyleCallback(1) },
    { fieldName: 'CANCEL1_OUT', dataType: 'text', header: { text: t('국가자격') }, styleCallback: createEduStyleCallback(1) },

    // 교육2
    { fieldName: 'EDU_DATE2', dataType: 'text', header: { text: t('수료일') }, styleCallback: createEduStyleCallback(2) },
    { fieldName: 'EDU_DATE_STOP2', dataType: 'text', header: { text: t('정지일') }, styleCallback: createEduStyleCallback(2) },
    { fieldName: 'CANCEL2_IN', dataType: 'text', header: { text: t('사내자격') }, styleCallback: createEduStyleCallback(2) },
    { fieldName: 'CANCEL2_OUT', dataType: 'text', header: { text: t('국가자격') }, styleCallback: createEduStyleCallback(2) },

    // 교육3
    { fieldName: 'EDU_DATE3', dataType: 'text', header: { text: t('수료일') }, styleCallback: createEduStyleCallback(3) },
    { fieldName: 'EDU_DATE_STOP3', dataType: 'text', header: { text: t('정지일') }, styleCallback: createEduStyleCallback(3) },
    { fieldName: 'CANCEL3_IN', dataType: 'text', header: { text: t('사내자격') }, styleCallback: createEduStyleCallback(3) },
    { fieldName: 'CANCEL3_OUT', dataType: 'text', header: { text: t('국가자격') }, styleCallback: createEduStyleCallback(3) },
  ],
  columnLayout: [
    'ASGN_FULL_NM',
    'JOB_TIT_NM',
    'EMP_NO',
    'EMP_NM',
    {
      name: "통합보수교육1",
      direction: "horizontal",
      header: { text: t("통합보수교육1") },
      items: [
        'EDU_DATE1',
        'EDU_DATE_STOP1',
        {
          name: 'CANCEL1_GROUP',
          direction: 'horizontal',
          header: { text: t('취소일') },
          items: ['CANCEL1_IN', 'CANCEL1_OUT']
        }
      ]
    },
    {
      name: "통합보수교육2",
      direction: "horizontal",
      header: { text: t("통합보수교육2") },
      items: [
        'EDU_DATE2',
        'EDU_DATE_STOP2',
        {
          name: 'CANCEL2_GROUP',
          direction: 'horizontal',
          header: { text: t('취소일') },
          items: ['CANCEL2_IN', 'CANCEL2_OUT']
        }
      ]
    },
    {
      name: "통합보수교육3",
      direction: "horizontal",
      header: { text: t("통합보수교육3") },
      items: [
        'EDU_DATE3',
        'EDU_DATE_STOP3',
        {
          name: 'CANCEL3_GROUP',
          direction: 'horizontal',
          header: { text: t('취소일') },
          items: ['CANCEL3_IN', 'CANCEL3_OUT']
        }
      ]
    }
  ]
});

grdMainProps.columns = grdMainProps.fields

const onButtonsClick = btn => {
  if(btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData) 
      .setAfter(afterSearch)
      .run()
  }
}

const searchData = () => {

  return commonSearchApi({ queryId : 'EDUBA0060_SEARCH_01', param: searchParams })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
//   setTimeout(() => {
//   grdMain.value.getGridView().refresh();
// }, 100); // 100ms 정도면 충분
}

const changedBSNS_CD = val => {
  Promise.all([
    commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: val, USE_DIV:'Y' } }), // 부서
  ]).then(res => {
    /* ************** 부서 데이터 세팅 **************** */
    codeList.deptCd = res[0].ORESULT_CUR
    codeList.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })

    searchParams.DEPT_CD = ''
  })

}

const initCodeList = () => {
  Promise.all([
    commonSearchApi({ queryId : 'searchBSNS', param : { CMPNY_DIV: userStore.cmpnyDiv, USE_DIV: 'N' } }), // 사업부
    commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: null, USE_DIV:'Y' } }), // 부서
  ]).then(res => {
    //사업부 데이터 세팅
    codeList.bsnsCd = res[0].ORESULT_CUR
    codeList.bsnsCd.unshift({ BSNS_NM:"전체", BSNS_CD:"" })
    let findIndex = res[0].ORESULT_CUR.findIndex(item => item.BSNS_CD === userStore.bsnsCd)
    searchParams.BSNS_CD = res[0].ORESULT_CUR[findIndex].BSNS_CD

    //부서 데이터 세팅
    codeList.deptCd = res[1].ORESULT_CUR
    codeList.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })

  })
}

//색상세팅
const gridStyles = [
  { name: 'yellow-cell', style: { background: '#fffacc' } },
  { name: 'orange-cell', style: { background: '#ffd8a6' } },
  { name: 'gray-cell', style: { background: '#e0e0e0' } }
];



// 사업부가 바뀌면 부서 데이터 가져옴
watch(() => searchParams.BSNS_CD, (newValue, oldValue) => {
  searchParams.DEPT_CD = ''
  commonSearchApi({ queryId : 'searchDept3', param : { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: newValue, USE_DIV:'Y' } })
    .then(res => {
      codeList.deptCd = res.ORESULT_CUR
      codeList.deptCd.unshift({ DEPT_NM:"전체", DEPT_CD:"" })

      if(firstLock.value === 0){
        let findIndex = res.ORESULT_CUR.findIndex(item => item.DEPT_CD === userStore.deptCd)
        searchParams.DEPT_CD = res.ORESULT_CUR[findIndex].DEPT_CD
        firstLock.value = 1
      } else {
        searchParams.DEPT_CD = res.ORESULT_CUR[0].DEPT_CD
      }
    }).finally(() => {
      //gridRefresh()
      if(firstLock.value === 1){
        // onButtonsClick({ id : 'btnSearch' })
        firstLock.value = 2
      }
    })
})

onMounted(() => {
  vm.$nextTick(() => {
    isAdmin.value = userStore.authGrpCd.includes("GRP00413") || userStore.authGrpCd.includes("HIWAYGRP00001") ? false : true
    initCodeList() 
    grdMain.value.getGridView().footer.visible = true
  })  
  // onButtonsClick({id: 'btnSearch'})
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle 
        :title="$t(useLogsStore().menuId)"
        ref="menuTitle"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"  
      />
    </v-card-title>

    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            :label="$t('사업부')"
            width=300px
            labelWidth="39px"
            v-model="searchParams.BSNS_CD"
            :items="codeList.bsnsCd"
            item-title="BSNS_NM"
            item-value="BSNS_CD"
            :disabled= "isAdmin"
            @update:model-value="changedBSNS_CD"
          />
          <i-select
            :label="$t('부서')"
            width=300px
            labelWidth="26px"
            v-model="searchParams.DEPT_CD"
            :items="codeList.deptCd"
            item-title="DEPT_NM"
            item-value="DEPT_CD"
            :disabled= "isAdmin"
            @update:model-value="changedDEPT_CD"
          />
          <i-input
              :label="$t('사번')"
              width=200px
              labelWidth="26px"
              v-model="searchParams.EMP_NO"
              @keydown.enter="() => onButtonsClick({ id : 'btnSearch' })"
              oninput="javascript: this.value = this.value.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣~`!@#$%^&*()_+|<>?:{}]/, '');"
              maxlength="20"
              @input="inputEMP_NO"
            />
            <i-input
              :label="$t('성명')"
              width=200px
              labelWidth="26px"
              v-model="searchParams.EMP_NM"
              @keydown.enter="() => onButtonsClick({ id : 'btnSearch' })"
              oninput="javascript: this.value = this.value.replace(/[0-9~!@#$%^&*()_+|<>?:{}]/, '' );"
              maxlength="500"
              @input="inputEMP_NM"
            /> 
        </v-sheet>
        <v-sheet class="h-auto">
          <div style="height:3%; justify-content: flex-end;" class="d-flex">
            <div class="mr-1" style="background-color: #FAED7D; font-size: large; border-radius: 5px;">　　</div>
            <div class="mr-2" style="font-size: large;"> 교육기간만료 임박</div>
            <div class="mr-1" style="background-color: #ffa500; font-size: large; border-radius: 5px;">　　</div>
            <div class="mr-2" style="font-size: large;"> 정지</div>
            <div class="mr-1" style="background-color: #d3d3d3; font-size: large; border-radius: 5px;">　　</div>
            <div class="mr-2" style="font-size: large;"> 취소</div>
          </div>
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
          />
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
::v-deep(.yellow-cell) {
  background-color: #ffff99 !important;
}
::v-deep(.orange-cell) {
  background-color: #ffa500 !important;
}
::v-deep(.gray-cell) {
  background-color: #d3d3d3 !important;
}

/* 기존 스타일 유지 */
::v-deep(.v-field__field) {
  max-height: 35px;
}
.select {
  background-color: rgb(238, 238, 239);
  cursor: pointer;
}
.unselect:hover {
  background-color: rgb(238, 238, 239);
  cursor: pointer;
}
::v-deep(.test > .v-input__control > .v-field > .v-field__field) {
  overflow-y: auto;
}
.test {
  width: 350px;
}
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}
</style>