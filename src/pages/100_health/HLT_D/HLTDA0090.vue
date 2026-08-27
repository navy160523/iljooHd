<!-- 
  화면명 : 보건 - 화학물질관리 - 특별관리물질 취급일지 작성/확인
  작성자: 일주지앤에스 SI1팀 박재형 선임
-->
<script setup>
import { reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import Message from '@hiway/utils/notify'
import HLTDA0090Popup from "./HLTDA0090Popup.vue"
import dayjs from "dayjs"
import { isEmpty } from '@/@core/utils'

// 특별관리물질 취급일지 작성/확인
defineOptions({
  name: '100_health-HLT_D-HLTDA0090',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const userStore = useUserStore()
const logsStore = useLogsStore()
const tab = ref("tab1")
const Popup = ref(null)
const accidentCount = ref(0);

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
  BSNS_CD: '', //사업부
  DEPT_CD: '', //부서
  // VNDCOD: '', //협력회사
  // SAUPBU: '', //사업본부
  DATE_FROM: "",
  DATE_TO: "",
  // USER_DIV: 'A', //조직구분
})

const searchParam1 = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
  BSNS_CD: '', //사업부
  DEPT_CD: '', //부서
  // VNDCOD: '', //협력회사
  // SAUPBU: '', //사업본부
  DATE_FROM: "",
  DATE_TO: "",
  // USER_DIV: 'A', //조직구분
})

const codeList = reactive({
  CMPNY: [], //회사구분
  BSNS_CD: [], //사업부
  DEPT_CD: [], //부서
  // VEND_CD: [], //협력사
  // GUBUN_CD: [], //조사구분
  // SAGO_BODY_CD: [], //신체부위
})

const initCodeList = () => {
  Promise.all([
  getCompanyList(),
  commonSearchApi({
      queryId: 'searchBSNS',
      param: { CMPNY_DIV: userStore.cmpnyDiv },
    }),
  //부서조회
  commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParam.BSNS_CD, USE_DIV: 'Y' },
    }),
  ]).then((res) => {
    console.log("INIT데이터", res);
    codeList.CMPNY = res[0].ORESULT_CUR
    codeList.BSNS_CD = res[1].ORESULT_CUR
    codeList.DEPT_CD = res[2].ORESULT_CUR
    // 리스트에 전체 추가
    codeList.CMPNY.unshift({ TXT: "전체", COD: "" });
    codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' });
    codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' });
  })
}

watch(
  () => searchParam.BSNS_CD,
  (newValue, oldValue) => {
    //부서조회
    commonSearchApi({
      queryId: 'searchDept3',
      param: { CMPNY_DIV: userStore.cmpnyDiv, BSNS_CD: searchParam.BSNS_CD, USE_DIV: 'Y' },
    }).then((res) => {
      searchParam.DEPT_CD = ''
      codeList.DEPT_CD = res.ORESULT_CUR
      codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    })
  }
)


// 버튼 
const onButtonsClick = (btn) => {
  if (btn.id === "btnMate"){
    if (Popup.value) {
      Popup.value.openPopup();  // ref가 존재할 때만 실행
    }
  }
}
// 취급일지 버튼
const onButtonsClick2 = (btn) => {
  if (btn.id === "btnSearch"){
    new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData1)
    .setAfter(afterSearch1)
    .run()
  }
}
// 사고내역 버튼
const onButtonsClick3 = (btn) => {
  if (btn.id === "btnSearch"){
    grdSub.value.getGridView().filterPanel.visible = true
    new queryFlowHelper(vm, t)
    .setGridList([grdSub])
    .setQuery(searchData2)
    .setAfter(afterSearch2)
    .run()
  }
}
watch(tab, (newTab) => {
  if (newTab === "tab2") {
    console.log("사고내역 탭이 선택됨");
    new queryFlowHelper(vm, t)
    .setGridList([grdSub])
    .setQuery(searchData2)
    .setAfter(afterSearch2)
    .run()
  }
});

const searchData1 = () => {
  console.log(" API 요청 데이터:", JSON.stringify(searchParam));
  return commonSearchApi({ queryId : 'HLTDA0090_SEARCH_01', param: searchParam })
}
const afterSearch1 = res => {
  console.log("조회:", res);
  const formattedData = res.ORESULT_CUR.map(row => {
    if (row.HAND_DATE && row.HAND_DATE.length === 8) {
      row.HAND_DATE = `${row.HAND_DATE.substring(0,4)}-${row.HAND_DATE.substring(4,6)}-${row.HAND_DATE.substring(6,8)}`;
    }
    return row;
  });
  grdMain.value.getDataProvider().setRows(formattedData)
}

const searchData2 = () => {
  grdSub.value.getGridView().filterPanel.visible = true
  console.log(" API 요청 데이터:", JSON.stringify(searchParam));
  return commonSearchApi({ queryId : 'HLTDA0090_SEARCH_02', param: searchParam })
}
const afterSearch2 = res => {
  console.log("조회:", res);

  if (res.ORESULT_CUR && res.ORESULT_CUR.length > 0) {
    accidentCount.value = res.ORESULT_CUR.length; // 무조건 총 개수 유지
    grdSub.value.getDataProvider().setRows(res.ORESULT_CUR); // 조회 조건에 맞는 데이터 표시
  } else {
    accidentCount.value = 0;
    grdSub.value.getDataProvider().setRows([]); // 데이터 없을 때 그리드 초기화
  }

  // accidentCount.value = res.ORESULT_CUR[0].AC_COUNT
  // console.log("사고건수 : ", accidentCount.value);

  // grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
}



// 탭1
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    // THLTIB0010W01 
    {
      fieldName: 'WORK_MATE_ID',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('용접재불출ID') },
      visible: false
    },
    {
      fieldName: 'HAND_DATE',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('취급일') },
      // styleName: "left-column",
    },
    {
      fieldName: 'KOR_NM',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('취급자') },
      // styleName: "left-column",
    },
    {
      fieldName: 'USE_MATE',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('취급제품') },
      styleName: "left-column",
    },
    {
      fieldName: 'DAILY_KG',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('일 사용량 (kg)') },
      // styleName: "left-column",
    },
    {
      fieldName: 'WORK_DESC',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('작업내용') },
      styleName: "left-column",
    }
    ],
  columns: [],
  columnLayout: [],
})
grdMainProps.columns = grdMainProps.fields

// 탭2
const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    // THLTIB0010W01 
    {
      fieldName: 'WORK_AC_ID',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('사고내역 ID') },
      visible: false
    },
    {
      fieldName: 'AC_DATE',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('발생 시각') },
    },
    {
      fieldName: 'AC_NM',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('재해자') },
    },
    {
      fieldName: 'USE_MATE',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('취급제품') },
      styleName: "left-column",
    },
    {
      fieldName: 'AC_DESC',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('피해 내용') },
      styleName: "left-column",
    },
    {
      fieldName: 'AC_WORK',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('조치사항') },
      styleName: "left-column",
    },
    {
      fieldName: 'AC_TREAT',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('조치자') },
    },
    ],
  columns: [],
  columnLayout: [
  // {
  //     name: `AC_COUNT`,
  //     direction: 'horizontal',
  //     items: ['AC_DATE', 'AC_NM', 'USE_MATE', 'AC_DESC', 'AC_WORK', 'AC_TREAT'],
  //   },
  ],
})
grdSubProps.columns = grdSubProps.fields



onMounted(() => {
  initCodeList()

  const today = dayjs().format('YYYY-MM-DD');
  // 한 달 전 날짜
  const monthAgo = dayjs().subtract(1, 'month').format('YYYY-MM-DD');

  searchParam.DATE_FROM = monthAgo;
  searchParam.DATE_TO = today;

  grdMain.value.getGridView().filterPanel.visible = true
  // 취급일지
  new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData1)
    .setAfter(afterSearch1)
    .run()

  // 사고내역
  // new queryFlowHelper(vm, t)
  //   .setGridList([grdSub])
  //   .setQuery(searchData2)
  //   .setAfter(afterSearch2)
  //   .run()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <!-- 최상단버튼 -->
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnMate']"
        @click-button="onButtonsClick"
        :use-permission="false"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="dflex-box">
            <div class="d-flex flex-column">
              <div class="d-flex mb-3 mt-2">
                <i-select 
                    :label="$t('회사구분')"
                    labelWidth="50px"
                    width="200px"
                    v-model="searchParam.CMPNY_DIV"
                    :items="codeList.CMPNY"
                    item-value="COD"
                    item-title="TXT"
                    :readonly=true
                  />
                  <i-select 
                    :label="$t('사업부')"
                    labelWidth="40px"
                    width="200px"
                    v-model="searchParam.BSNS_CD"
                    :items="codeList.BSNS_CD"
                    item-value="BSNS_CD"
                    item-title="BSNS_NM"
                  />
                <i-select
                  :label="$t('부서')"
                  width="200px"
                  label-width="30px"
                  v-model="searchParam.DEPT_CD"
                  :items="codeList.DEPT_CD"
                  item-value="DEPT_CD"
                  item-title="DEPT_NM"
                  :readonly="isEmpty(searchParam.BSNS_CD)"
                ></i-select>
              </div>

              <div class="d-flex">
                <i-input
                  :label="$t('작성일자')"
                  type="date"
                  width="200px"
                  :disabled="searchParam.dtDate === 'A' ? true : false"
                  v-model="searchParam.DATE_FROM"
                >
                </i-input>
                <span class="mt-2">~</span>
                <i-input
                  class="ml-3"
                  type="date"
                  width="180px"
                  :disabled="searchParam.dtDate === 'A' ? true : false"
                  v-model="searchParam.DATE_TO"
                >
                </i-input>
              </div>
            </div>

            <div class="txt-flex">
              <table>
                <span class="fs-5">착용보호구</span>
                <tr>
                  <td>호흡기 보호구 : 1급 이상 방진 마스크</td>
                  <td>안면, 눈 보호구 : 용접면, 보안경</td>
                </tr>
                <tr>
                  <td>보호구/보호장갑 : 용접복 및 용접 장갑</td>
                  <td>기타 보호구 : 해당 작업 적합한 보호구 착용</td>
                </tr>
              </table>
            </div>
          </div>
        </v-sheet>
        <v-sheet class="pa-0">
          <v-tabs v-model="tab">
            <v-tab value="tab1">취급일지</v-tab>
            <v-tab value="tab2">사고내역</v-tab>
          </v-tabs>
        </v-sheet>

        <v-window v-model="tab" class="h-window">
          <!-- 탭1 -->
          <v-window-item value="tab1">
            <div class="h-grow">
              <v-sheet width="50%" class="pa-0 h-auto mr-3">
                <!-- 취급일지 버튼 -->
                <IGridTitle
                  class="mt-2"
                  :button-list="['btnSearch']"
                  @click-button="onButtonsClick2"
                >
                </IGridTitle>
                <RealGrid
                  ref="grdMain"
                  :grid-view-option="grdMainProps.gridViewOption"
                  :keys="grdMainProps.keys" 
                  :fields="grdMainProps.fields"
                  :columns="grdMainProps.columns"
                  @onCellClicked="onDeptSelect"
                />
              </v-sheet>
            </div>
          </v-window-item>

          <!-- 탭2 -->
          <v-window-item value="tab2">
            <div class="h-grow">
              <v-sheet width="50%" class="pa-0 h-auto mr-3">
                <div class="head_box">
                  <div class="ac_box">
                    사고내역 {{ accidentCount }} 건
                  </div>
                  <!-- 사고내역 버튼 -->
                  <IGridTitle
                    class="mt-2"
                    :button-list="['btnSearch']"
                    @click-button="onButtonsClick3"
                  >
                  </IGridTitle>
                </div>
                <RealGrid
                  ref="grdSub"
                  :grid-view-option="grdSubProps.gridViewOption"
                  :keys="grdSubProps.keys" 
                  :fields="grdSubProps.fields"
                  :columns="grdSubProps.columns"
                  @onCellClicked="onDeptSelect"
                />
              </v-sheet>
            </div>
          </v-window-item>

        </v-window>
      </div>
    </v-card-text>
  </v-card>
  <HLTDA0090Popup ref="Popup"></HLTDA0090Popup>
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
.dflex-box {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

table {
  border-collapse: collapse;
  margin-left: 170px;
}

td {
  border: 1px solid black;
  border-collapse: collapse;
  padding: 8px;
}
.txt-flex {
  display: flex;
  justify-content: right;
}

.head_box {
  display: flex;
}

.ac_box {
  width: 99%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 60px;
  font-size: 17px;
}

</style>


