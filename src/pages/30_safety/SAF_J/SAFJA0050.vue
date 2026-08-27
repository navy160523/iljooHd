<!--
  화면명 : 단기공사 안전교육 현황/관리
  화면개요 : 단기공사 안전교육 현황/관리
  최종수정일자: 2024-04-22
  작성자: 김우빈
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue";
import { useUserStore } from '@hiway/stores/user'
import { useLogsStore } from '@hiway/stores/logs'
import { useI18n } from "vue-i18n";
import IMenuTitle from "@/components/IMenuTitle.vue";
import IGridTitle from "@/components/IGridTitle.vue";

import RealGrid from "@/components/RealGrid.vue";
import Message from '@hiway/utils/notify'
import { commonSearchApi, commonRequest3, commonExecuteApi, commonLogExecuteApi } from '@hiway/api/commonApi'
import queryFlowHelper from "@/utils/searchFlowHelper"
import saveFlowHelper from '@/utils/saveFlowHelper'
import { yearMonthDay } from '@/utils/common.js'


defineOptions({
  name: "SAFJA0050",
});
 
onMounted(() => {
  // grd1.value.getDataProvider().setRows(data);
  initCodeList()
});


const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t; //다국어
const menuTitle = ref(null);
const userStore = useUserStore()
const grd1 = ref(null);
const grd2 = ref(null);
const grd3 = ref(null);

const searchParams = reactive({
  BASE_DT: yearMonthDay(),
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: userStore.bsnsCd,               //사업부
  DEPT_CD: userStore.deptCd
})

const codeList = reactive({
  dataList1: [],  //사업부
  dataList2: [],  //부서

})

// 사업부가 바뀌면 부서 데이터 가져옴
watch(
  () => searchParams.BSNS_CD,
  (newValue, oldValue) => {
    // oldValue(변경전 데이터)가 있으면 options.values.DEPT_CD(부서)를 전체로 변경
    if (oldValue !== newValue) {
      commonSearchApi({
        queryId: "searchDept3",
        param: {
          CMPNY_DIV: userStore.cmpnyDiv,
          BSNS_CD: newValue,
          USE_DIV: "Y",
        },
      }).then((res) => {
        codeList.dataList2 = res.ORESULT_CUR
        codeList.dataList2.unshift({ DEPT_NM: "전체", DEPT_CD: "" })
      })
    }

    if (oldValue && oldValue !== "") {
      searchParams.DEPT_CD = ""
    }
  }
)

//코드리스트 셋팅
const initCodeList = () => {
  Promise.all([
    //사업부
    commonSearchApi({ queryId: 'searchBSNS', param: { CMPNY_DIV: userStore.cmpnyDiv } }),
    // 부서
    commonSearchApi({
      queryId: "searchDept3",
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: null, USE_DIV: "Y" },
    }), 

  ]).then(res => {
    console.log("레스 확인", res)

    //사업부 콤보박스
    codeList.dataList1 = res[0].ORESULT_CUR
    codeList.dataList1.unshift({ BSNS_NM: "전체", BSNS_CD: "" })
    // 부서
    codeList.dataList2 = res[1].ORESULT_CUR
    codeList.dataList2.unshift({ DEPT_NM: "전체", DEPT_CD: "" })

    searchParams.BSNS_CD = userStore.bsnsCd
    searchParams.DEPT_CD = userStore.deptCd
  })
}

//그리드 설정
const grdProps1 = reactive({
  fields: [
    { fieldName: "VND_NAME", dataType: "text", width: 80, header: { text: t("회사명") },editable: false },
    { fieldName: "WORK_DESC", dataType: "text", width: 80, header: { text: t("공사명") },editable: false,styleName: 'left-column' },
    { fieldName: "WORK_DT", dataType: "text", width: 80, header: { text: t("공사기간") },editable: false },
    { fieldName: "WORK_CNT", dataType: "text", width: 40, header: { text: t("출입인원") },editable: false },
    { fieldName: "WORK_CNT_EDU", dataType: "text", width: 60, header: { text: t("소속부서교육 미이수 인원") },editable: false,
      'styleCallback': function(grid, dataCell){
        var ret = {editable : false, styleName : 'middle_column', enabled: false, style: {background: undefined}}
        var data = grid.getValue(dataCell.index.itemIndex, 'WORK_CNT_EDU')

        if(data == null) return ret
        if(data > 0) {
          ret.style.background = '#ff8080'
          return ret
        }
        return ret
      }
    },
    { fieldName: "WORK_CNT_EDU120", dataType: "text", width: 50, header: { text: t("안전부교육 미이수 인원") },editable: false,
      'styleCallback': function(grid, dataCell){
        var ret = {editable : false, styleName : 'middle_column', enabled: false, style: {background: undefined}}
        var data = grid.getValue(dataCell.index.itemIndex, 'WORK_CNT_EDU120')

        if(data == null) return ret
        if(data > 0) {
          ret.style.background = '#ff8080'
          return ret
        }
        return ret
      }
    },
    { fieldName: "DEPT_EMP_NM", dataType: "text", width: 50, header: { text: t("부서담당자") },editable: false },
    { fieldName: "WORK_PIC_EMPNM", dataType: "text", width: 50, header: { text: t("공사책임자") }, editable: false },
    { fieldName: "WORK_PIC_MOBILE", dataType: "text", width: 80, header: { text: t("공사책임자번호") }, editable: false },
    { fieldName: "WORK_NO", dataType: "text", header: { text: t("") }, visible: false },
    { fieldName: "REV_NO", dataType: "text", header: { text: t("") }, visible: false },
    { fieldName: "BIZ_REG_NO", dataType: "text", header: { text: t("") }, visible: false },
    { fieldName: "BSNS_CD", dataType: "text", header: { text: t("") }, visible: false },
    { fieldName: "DEPT_CD", dataType: "text", header: { text: t("") }, visible: false },
    { fieldName: "VEND_CD", dataType: "text", header: { text: t("") }, visible: false },

    { fieldName: "CMPNY_DIV", dataType: "text", header: { text: t("") }, editable: false,visible: false },
    
    { fieldName: "SEQ", dataType: "text", header: { text: t("") },editable: false,visible: false },
  ],
  columns: [],
  columnLayout: [],
});
grdProps1.columns = grdProps1.fields;

//그리드 설정
const grdProps2 = reactive({
  gridViewOption : {          
    checkBar: { visible: true }
  },
  fields: [
    { fieldName: "NAME", dataType: "text", header: { text: t("성명") },editable: false },
    { fieldName: "EDU_COMP_DT_1", dataType: "text", header: { text: t("이수일") },editable: false },
    { fieldName: "EDU_END_DT_1", dataType: "text", header: { text: t("만료일") },editable: false },
    
    { fieldName: "EDU_REQ_YN", dataType: "text", header: { text: t("교육필요") },editable: false,
      'styleCallback': function(grid, dataCell){
        var ret = {editable : false, styleName : 'middle_column', enabled: false, style: {background: undefined}}
        var data = grid.getValue(dataCell.index.itemIndex, 'EDU_REQ_YN')

        if(data == null) return ret
        if(data == 'Y') {
          ret.style.background = '#ff8080'
          return ret
        }
        return ret
      }
    },
    { fieldName: "EDU_COMP_DT_2", dataType: "text", header: { text: t("이수일") },editable: false },
    { fieldName: "EDU_END_DT_2", dataType: "text", header: { text: t("만료일") },editable: false },
    { fieldName: "EDU_REQ_YN120", dataType: "text", header: { text: t("교육필요") },editable: false,
      'styleCallback': function(grid, dataCell){
        var ret = {editable : false, styleName : 'middle_column', enabled: false, style: {background: undefined}}
        var data = grid.getValue(dataCell.index.itemIndex, 'EDU_REQ_YN120')

        if(data == null) return ret
        if(data == 'Y') {
          ret.style.background = '#ff8080'
          return ret
        }
        return ret
      }
    },
    { fieldName: "CERT_VNO", dataType: "text", header: { text: t("ID") },editable: false },
    { fieldName: "EDU_COMP_DT_3", dataType: "text", header: { text: t("이수일") },editable: false },
    { fieldName: "EDU_END_DT_3", dataType: "text", header: { text: t("만료일") },editable: false },
    { fieldName: "EXCEPT_YN", header: { text: t("교육제외") },editable: true ,renderer: { type: 'check',trueValues: 'Y', falseValues: 'N' },},

    { fieldName: "CMPNY_DIV", dataType: "text", header: { text: t("") }, editable: false, visible: false },
    { fieldName: "BIZ_REG_NO", dataType: "text", header: { text: t("") }, editable: false, visible: false },
    { fieldName: "VEND_CD", dataType: "text", header: { text: t("") }, editable: false, visible: false },
    { fieldName: "WORK_NO", dataType: "text", header: { text: t("") }, editable: false, visible: false },
    { fieldName: "REV_NO", dataType: "text", header: { text: t("") }, editable: false, visible: false },
    { fieldName: "BIR_DAY", dataType: "text", header: { text: t("") }, editable: false, visible: false },
    { fieldName: "SEQ", dataType: "text", header: { text: t("") }, editable: false, visible: false },

  ],
  columns: [],
  columnLayout: [
    "NAME",
    "EXCEPT_YN",
    {
      name: "소속부서교육(공통)",
      direction: "horizontal",
      hideChildHeaders: false,
      items: ["EDU_COMP_DT_1", "EDU_END_DT_1", "EDU_REQ_YN"],
      header: { text: t("소속부서교육(공통) ※유효기간: 3개월") },
    },
    {
      name: "안전부 대면교육(15일 이상)",
      direction: "horizontal",
      hideChildHeaders: false,
      items: ["EDU_COMP_DT_2", "EDU_END_DT_2","EDU_REQ_YN120"],
      header: { text: t("안전부 대면교육(15일 이상) ※유효기간: 1년") },
    },
    {
      name: "온라인교육(15일 미만)",
      direction: "horizontal",
      hideChildHeaders: false,
      items: ["CERT_VNO", "EDU_COMP_DT_3","EDU_END_DT_3"],
      header: { text: t("온라인교육(15일 미만) ※유효기간: 6개월") },
    },
    
  ],
});
grdProps2.columns = grdProps2.fields;

//그리드 설정
const grdProps3 = reactive({
  fields: [
    { fieldName: "INSERT_DATE", dataType: "text", header: { text: t("처리일시") },editable: false },
    { fieldName: "INSERT_USER_NM", dataType: "text", header: { text: t("처리자") },editable: false },
    { fieldName: "EXCEPT_YN", dataType: "text", header: { text: t("제외여부") },editable: false },
    
  ],
  columns: [],
  columnLayout: [
  ],
});
grdProps3.columns = grdProps3.fields;


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
  grd2.value.getDataProvider().setRows();
  // console.log('acdtParms ', acdtParms)
  const acdtParms = {
    CMPNY_DIV: searchParams.CMPNY_DIV,
    BASE_DT: searchParams.BASE_DT.replaceAll('-',''),
    BSNS_CD: searchParams.BSNS_CD,
    DEPT_CD: searchParams.DEPT_CD,
  }

  // 개인정보 조회 로그 남기기
  let params = {
    userStore: userStore,
    params: acdtParms,
    mgs: '[단기공사 안전교육 현황/관리] 화면 - 개인정보관련 조회했습니다.',
    crudGbn: 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc: '', // 사유입력
    menuId: useLogsStore().menuId,
    menuNm: t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)

  return commonSearchApi({ queryId : 'SAFJA0050_SEARCH_01', param : acdtParms })

}
const afterSearch = res => {
  grd1.value.getDataProvider().setRows(res.ORESULT_CUR);

  // grd1.value.getDataProvider().setRows(res.ORESULT_CUR, "ALL_SYS_CD")
}

//저장로직
const beforeSave = () => {
  return true
}
const saveData = () => {
  const chkRows = grd2.value.getGridView().getCheckedRows(true)
  const param = []

  if (chkRows.length < 1) {
    Message.warn(t('선택된 데이터가 없습니다.'))
    return false
  } else {
    for (let rowIdx of chkRows) {
      let data = grd2.value.getDataProvider().getJsonRow(rowIdx)
      console.log('data ', data)
        param.push({
        CMPNY_DIV: data.CMPNY_DIV,
        BIZ_REG_NO: data.BIZ_REG_NO,
        VEND_CD: data.VEND_CD,
        WORK_NO: data.WORK_NO,
        REV_NO: data.REV_NO,
        BIR_DAY: data.BIR_DAY,
        SEQ: data.SEQ,
        EXCEPT_YN: data.EXCEPT_YN,
        USER_ID: userStore.userId,
      })
    }
  }
  return commonExecuteApi({ queryId: "SAFJA0050_SAVE_01", list: param })
  // return true
}


const onSubGrdRowChanged = (grid, oldRow, newRow) => { 
  
  if (newRow === -1) {
    return
  }
  //기존 선택된 CHECK 값 미리 가져옴.
  const data2 = grd1.value.getDataProvider().getJsonRow(newRow)

  console.log('data2 ', data2)

  const acdtParms = {
    CMPNY_DIV: data2.CMPNY_DIV,
    BIZ_REG_NO: data2.BIZ_REG_NO,
    VEND_CD: data2.VEND_CD,
    WORK_NO: data2.WORK_NO,
    REV_NO: data2.REV_NO,
    BSNS_CD: data2.BSNS_CD,
    DEPT_CD: data2.DEPT_CD,
  }

  grd3.value.getDataProvider().setRows();

  commonSearchApi({
    queryId: 'SAFJA0050_SEARCH_02'
    , param: acdtParms
  }).then((res) => {
    if (res.ORESULT_CUR.length > 0) {
      grd2.value.getDataProvider().setRows(res.ORESULT_CUR);
    } else {
      grd2.value.getDataProvider().setRows();
    }
  })

}


const onSub2GrdRowChanged = (grid, oldRow, newRow) => { 
  //기존 선택된 CHECK 값 미리 가져옴.
  const data2 = grd2.value.getDataProvider().getJsonRow(newRow)
 
  console.log('data ', data2)

  const acdtParms = {
    CMPNY_DIV: data2.CMPNY_DIV,
    BIZ_REG_NO: data2.BIZ_REG_NO,
    VEND_CD: data2.VEND_CD,
    WORK_NO: data2.WORK_NO,
    REV_NO: data2.REV_NO,
    BIR_DAY: data2.BIR_DAY,
    SEQ: data2.SEQ,
  }
  const data = {
    queryId: 'SAFJA0050_SEARCH_03'
    , param: acdtParms
  }

  const meta = {
    useProgress: false
  }

  commonRequest3("/hse/common/selectList", data, meta)
    .then((res) => {
    if (res.ORESULT_CUR.length > 0) {
      grd3.value.getDataProvider().setRows(res.ORESULT_CUR);
    } else {
      grd3.value.getDataProvider().setRows();
    }
  })

  // commonSearchApi({
  //   queryId: 'SAFJA0050_SEARCH_03'
  //   , param: acdtParms
  // }).then((res) => {

  //   console.log('res ', res)

  //   if (res.ORESULT_CUR.length > 0) {
  //     grd3.value.getDataProvider().setRows(res.ORESULT_CUR);
  //   } else {
  //     grd3.value.getDataProvider().setRows();
  //   }

  // })

}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        title="단기공사 안전교육 현황/관리"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex pb-2">
            <i-input
                :label="$t('기준일')"
                required
                type="date"
                class="mr-2"
                width="255px"
                label-width="50px"
                v-model="searchParams.BASE_DT"
              />
            
            <i-select
              :label="$t('사업부')" 
              :items="codeList.dataList1"
              v-model="searchParams.BSNS_CD"
              required
              class="mr-2 ml-2"
              item-value="BSNS_CD"
              item-title="BSNS_NM"
              label-width="50px"
              width="250px"
              
            />

            <i-select
              :label="$t('부서')" 
              :items="codeList.dataList2"
              v-model="searchParams.DEPT_CD"
              class="ml-2"
              item-value="DEPT_CD"
              item-title="DEPT_NM"
              label-width="50px"
              width="250px"
            />
          </div>
        </v-sheet>

        <div class="h-grow">
          <v-sheet class="h-auto mr-2" width="50%">
            <IGridTitle title="단기공사 리스트"/>
                <RealGrid
                  ref="grd1"
                  class="mt-1"
                  :grid-view-option="grdProps1.gridViewOption"
                  :keys="grdProps1.keys"
                  :fields="grdProps1.fields"
                  :columns="grdProps1.columns"
                  :column-layout="grdProps1.columnLayout"
                  @onCurrentRowChanged="onSubGrdRowChanged"
                  />
  
          </v-sheet>
          <v-sheet class="h-auto" width="50%">
            <IGridTitle ref="menuTitle" title="출입인원 리스트" :button-list="['btnUpdate']" @click-button="onButtonsClick" />
            <RealGrid
              ref="grd2"
              class="mt-1"
              :grid-view-option="grdProps2.gridViewOption"
              :keys="grdProps2.keys"
              :fields="grdProps2.fields"
              :columns="grdProps2.columns"
              :column-layout="grdProps2.columnLayout"
              @onCurrentRowChanged="onSub2GrdRowChanged"
              
              />
            <IGridTitle title="교육제외처리 이력" class="mt-1"/>
            <RealGrid
              ref="grd3"
              class="mt-1"
              :grid-view-option="grdProps3.gridViewOption"
              :keys="grdProps3.keys"
              :fields="grdProps3.fields"
              :columns="grdProps3.columns"
              :column-layout="grdProps3.columnLayout"
            />
          </v-sheet>
        </div>
      </div>
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
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 400px;
  }
}

.rightSide {
  flex-basis: 50%;
    display: flex;
    flex-direction: column;
    margin-left: 15px;
}

.leftSide {
  flex-basis: 50%;
}

</style>
