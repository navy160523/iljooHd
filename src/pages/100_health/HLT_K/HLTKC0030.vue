<!-- 
  화면명 : 보건 - 협력사 건강관리 - 사후관리 실적 모니터링
  작성자: 일주지앤에스 SI1팀 박재형 선임
-->
<script setup>
import { reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import saveFlowHelper from '@/utils/saveFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import Message from '@hiway/utils/notify'
import dayjs from "dayjs"
import { isEmpty } from '@/@core/utils'
import VendTreePopup from '@/components/popup/VendTreePopup.vue'
import IButtonList from '@/components/IButtonList.vue'

// 사후관리 실적 모니터링
defineOptions({
  name: '100_health-HLT_K-HLTKC0030',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const menuTitle2 = ref(null)
const grdMain = ref(null)
const grdSub = ref(null)
const userStore = useUserStore()
const logsStore = useLogsStore()
const tab = ref("tab1")
const Popup = ref(null)
const vendTreePopup = ref(null)
const saveParams = reactive([]);
const deleteParams = reactive([]);
const isAdmin = ref(false)
const isAdmin2 = ref(false)

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv, //사업장구분
  YEAR: new Date().getFullYear().toString(), //기준년도
  QUARTER: '',
  VEND_CD: '',
  VEND_NAME: '',
  // VEND_CD: userStore.asgnCd,
  // VEND_NAME: userStore.asgnNm
})

const codeList = reactive({
  CMPNY: [], //회사구분
  BSNS_CD: [], //사업부
  DEPT_CD: [], //부서
  QUARTER: [
    { COD: '1', TXT: '1분기' },
    { COD: '2', TXT: '2분기' },
    { COD: '3', TXT: '3분기' },
    { COD: '4', TXT: '4분기' },
  ] //분기
})

const initCodeList = () => {
  // 협력사 건강관리 모듈 관리자 여부 확인 ( 모듈관리자, admin그룹, 보건총괄관리자 )
  if (userStore.authGrpCd.includes('HLTK001') 
        || userStore.authGrpCd.includes('HIWAYGRP00001')
        || userStore.authGrpCd.includes('GRP00372')
        ) {
        isAdmin.value = true // 관리자
        // console.log("isAdmin.value", true)
    } else {
        isAdmin.value = false // 일반 사용자
        // console.log("isAdmin.value", false)
    }

    // ip, login id 비교하여 인가된 계정, ip인지 확인
  userStore.getAuthIpMenus().then(res => {
    if(res.filter(item => item.EMP_NO == userStore.empNo && 
      item.PGM_ID == useLogsStore().menuId &&
      item.IP_ADD == userStore.clientIp).length > 0) {
      isAdmin2.value = true
    }
  })

    // 권한 없을때
    if (!isAdmin.value && !isAdmin2.value) {
      vm.$swal({
        title: t('메뉴 사용 권한이 없습니다. 메뉴 사용을 희망하시는 경우\r\n시스템 관리자에게 IP 권한 등록을 요청하시기 바랍니다.\r\n\n☎ 문의처 : 안전보건지원부 보건관리과 T. 3-3022'),
        showCancelButton: false,
      });
      menuTitle.value.setBtnProperty('btnSearch', 'visible', false);
      menuTitle2.value.setBtnProperty('btnUpdate', 'visible', false);
      menuTitle2.value.setBtnProperty('btnPrint', 'visible', false);
    }

    // 관리자 아니고 협력사일때
    // 협력사는 실적산출은 조회 못하고 결과 조회만 가능
    // 결과조회 탭 선택시 버튼 보이게함 (changeTab)
    // 소속 변경 못하게 openVendPopup 
    if (!isAdmin.value && isAdmin2.value) {
      menuTitle.value.setBtnProperty('btnSearch', 'visible', false);
      menuTitle2.value.setBtnProperty('btnUpdate', 'visible', false);

      // 협력사일때 본인 협력사로 조회
      searchParam.VEND_CD = userStore.asgnCd;
      searchParam.VEND_NAME = userStore.asgnNm;
    }


    // 리스트에 전체 추가
    // codeList.QUARTER.unshift({ TXT: '전체', COD: '' });

    let month = dayjs().format("MM")
    if (['01', '02', '03'].includes(month)) {
    // console.log('1')
    searchParam.QUARTER = '1'
  } else if (['04', '05', '06'].includes(month)) {
    // console.log('2')
    searchParam.QUARTER = '2'
  } else if (['07', '08', '09'].includes(month)) {
    // console.log('3')
    searchParam.QUARTER = '3'
  } else if (['10', '11', '12'].includes(month)) {
    // console.log('4')
    searchParam.QUARTER = '4'
  }
  
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
  if (btn.id === "btnSearch"){
    new queryFlowHelper(vm, t)
    .setGridList([grdMain])
    .setQuery(searchData)
    .setAfter(afterSearch)
    .run()
  }
}
// 실적산출 버튼
const onButtonsClick2 = (btn) => {
  if (btn.id === "btnUpdate"){
    new saveFlowHelper(vm, t)
    .setBefore(beforeSave)
    .setQuery(saveData)
    .setAfter(() => {
        onButtonsClick({ id: 'btnSearch' })
      })
    .run()
  }
}

// // 결과조회 버튼
const onButtonsClick3 = (btn) => {
  if (btn.id === "btnPrint"){
    {
    if(grdSub.value.getDataProvider().getRowCount()==0)
    {
      return Message.warn('조회 후 출력해주세요.')
    }
    else
    {
      grdSub.value.getGridView().exportGrid({ 
        type: 'excel',
        target: 'local',
        fileName: searchParam.YEAR+ '년 ' + searchParam.QUARTER + '분기' + ' 사후관리 실적 모니터링',
        progressMessage: '엑셀 다운로드중입니다.',
        showProgress: true,
        indicator: 'visible',
        header: 'visible',
        footer: 'hidden',
        allColumns: false,
        exportTemplate: true
      })
    }
    }
  }
}

const searchData = () => {
  if(tab.value=="tab1"){
    // console.log(" API 요청 데이터:", JSON.stringify(searchParam));
    deleteParams.splice(0, deleteParams.length); // 기존값 clear
    deleteParams.push({
      CMPNY_DIV: userStore.cmpnyDiv,
      YEAR: searchParam.YEAR,
      QUARTER: searchParam.QUARTER
    });
    // console.log("delete", deleteParams)

    return commonSearchApi({ queryId : 'HLTKC0030_SEARCH_01', param: searchParam })
  }else {
    // console.log(" API 요청 데이터2:", JSON.stringify(searchParam));
    return commonSearchApi({ queryId : 'HLTKC0030_SEARCH_02', param: searchParam })
  }

}
const afterSearch = (res) => {
  if(tab.value=="tab1"){
    // console.log("res", res)
    const rows = res.ORESULT_CUR.map((row) => {
      const reg = Number(row.REG_CNT) || 0;
      const risk = Number(row.RISK_CNT) || 0;
      const rate = risk === 0 ? 0 : parseFloat(((reg / risk) * 100).toFixed(2));
      // const rate = risk === 0 ? 0 : Math.round((reg / risk) * 100); // 소수점 버림
  
      return {
        ...row,
        REG_RATE: rate  // 새로 추가되는 등록율 필드
      };
    });
  
    grdMain.value.getDataProvider().setRows(rows)
  } else {
    // console.log("결과조회", res)
    grdSub.value.getDataProvider().setRows(res.ORESULT_CUR)
  }

}

const beforeSave = () => {
  // debugger
  if(grdMain.value.getDataProvider().getRowCount()==0)
  {
    return Message.warn('조회 후 저장해주세요.')
  }

  saveParams.length = 0;
  // deleteParams.length = 0;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const quarter = Math.ceil(month / 3);

    const allRows = grdMain.value.getDataProvider().getJsonRows();
    // console.log("allRows : ", allRows)

    allRows.forEach(row => {
      saveParams.push({
        CMPNY_DIV: userStore.cmpnyDiv, // 회사 구분 (고정값)
        VEND_CD: row.VEND_CD,
        VEND_NM: row.VEND_NM,
        TOT_CNT: row.TOT_CNT,
        RISK_CNT: row.RISK_CNT,
        REG_CNT: row.REG_CNT,
        REG_RATE: row.REG_RATE,
        USER_ID: userStore.userId, // 사용자 ID (고정값)
        // YEAR: row.YEAR,
        YEAR: searchParam.YEAR,
        // QUARTER: row.QUARTER,
        QUARTER: searchParam.QUARTER
        // YEAR: year.toString(), 
        // QUARTER: quarter.toString()
      })
    })
  return true;
}
const saveData = async () => {
  await commonExecuteApi({
    queryId: 'HLTKC0030_DELETE_01',
    list: deleteParams
  });
  // 2. 새로 저장
  return await commonExecuteApi({
    queryId: 'HLTKC0030_SAVE_01',
    list: saveParams
  });
};


const openVendPopup = () => {
  // 관리자가 아닌 ip 인가 받은 협력사일경우 소속 변경불가
  if(!isAdmin.value && isAdmin2.value){
    Message.warn(t('협력사는 소속 변경이 불가합니다.'))
    return;
  }
  // 관리자도 아니고 협력사도 아닐때
  if(!isAdmin.value && !isAdmin2.value){
    Message.warn(t('메뉴 사용 권한이 없습니다.'))
    return;
  }
  vendTreePopup.value.openPopup({ ORGN_DIV: 'B' })
}

const selectedVend = (data) => {
  // console.log("소속팝업데이터", data)
  searchParam.VEND_CD = data.ASGN_CD
  searchParam.VEND_NAME = data.ASGN_NM
}


// 탭1
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: false } },
  fields: [
    // THLTIB0010W01
    {
      fieldName: 'VEND_CD',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('협력사 코드') },
    },
    {
      fieldName: 'VEND_NM',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('협력사 명') },
      // styleName: "left-column",
    },
    {
      fieldName: 'TOT_CNT',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('총 인원') },
      // styleName: "left-column",
    },
    {
      fieldName: 'RISK_CNT',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('건강관리위험대상인원') },
      // styleName: "left-column",
    },
    {
      fieldName: 'REG_CNT',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('실적 등록 인원') },
      // styleName: "left-column",
    },
    {
      fieldName: 'REG_RATE',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('실적 등록율(%)') },
      // styleName: "left-column",
    },
    {
      fieldName: 'YEAR',
      dataType: 'text',
      width: '120',
      editable: false,
      visible: false,
      header: { text: t('년도') },
      // styleName: "left-column",
    },
    {
      fieldName: 'QUARTER',
      dataType: 'text',
      width: '120',
      editable: false,
      visible: false,
      header: { text: t('분기') },
      // styleName: "left-column",
    }
    ],
  columns: [],
  columnLayout: [],
})
grdMainProps.columns = grdMainProps.fields

// 탭2
const grdSubProps = reactive({
  gridViewOption: { checkBar: { visible: false } },
  fields: [
    // THLTIB0010W01 
    {
      fieldName: 'VEND_CD',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('협력사 코드') }, 
    },
    {
      fieldName: 'VEND_NM',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('협력사 명') },
      // styleName: "left-column",
    },
    {
      fieldName: 'TOT_CNT',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('총 인원') },
      // styleName: "left-column",
    },
    {
      fieldName: 'RISK_CNT',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('건강관리위험대상인원') },
      // styleName: "left-column",
    },
    {
      fieldName: 'REG_CNT',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('실적 등록 인원') },
      // styleName: "left-column",
    },
    {
      fieldName: 'REG_RATE',
      dataType: 'text',
      width: '120',
      editable: false,
      header: { text: t('실적 등록율(%)') },
      // styleName: "left-column",
    }
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


const changeTab = () =>
{
  nextTick(() => {
    if(tab.value=="tab1")
    {
      grdMain.value.getGridView().filterPanel.visible = true;
    }
    else if(tab.value=="tab2")
    {
      grdSub.value.getGridView().filterPanel.visible = true;
    }

    // 협력사는 결과조회만 가능
    // tab2 일때 조회버튼 살림
    if (!isAdmin.value && isAdmin2.value) {
      if (tab.value==="tab2") {
      menuTitle.value.setBtnProperty('btnSearch', 'visible', true);
      } else {
      menuTitle.value.setBtnProperty('btnSearch', 'visible', false);
      menuTitle2.value.setBtnProperty('btnUpdate', 'visible', false);
      }
    }

    if (!isAdmin.value && !isAdmin2.value) {
      if (tab.value==="tab2") {
        menuTitle2.value.setBtnProperty('btnPrint', 'visible', false);
      }
    }
  })
}



onMounted(() => {
  initCodeList()
  grdMain.value.getGridView().filterPanel.visible = true
  // 실적산출
  // new queryFlowHelper(vm, t)
  //   .setGridList([grdMain])
  //   .setQuery(searchData)
  //   .setAfter(afterSearch)
  //   .run()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <!-- 최상단버튼 -->
      <IGridTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch']"
        @click-button="onButtonsClick"
        :use-permission="true"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="dflex-box">
            <div class="d-flex flex-column">
              <div class="d-flex mb-3 mt-2">
                <i-select :label="$t('기준년도')" width="200px" v-model="searchParam.YEAR" type="YEAR"></i-select>
                  <i-select
                    :label="$t('분기')"
                    width="200px"
                    label-width="30px"
                    v-model="searchParam.QUARTER"
                    :items="codeList.QUARTER"
                    item-value="COD"
                    item-title="TXT"
                  />
                  <!-- <i-input
                    v-model="searchParam.VEND_NAME"
                    label-width="50px"
                    :label="$t('협력사')"
                    width="180px"
                    :readonly="true"
                  />
                  <i-input
                    v-model="searchParam.VEND_CD"
                    width="150px"
                    append-inner-icon="mdi-magnify"
                    @click:appendInner="openVendPopup"
                    @keydown.enter="openVendPopup"
                    :readonly="true"
                  >
                  </i-input> -->
              </div>
            </div>
          </div>
        </v-sheet>
        <v-sheet class="pa-0">
          <v-tabs v-model="tab" @update:model-value="changeTab">
            <v-tab value="tab1">실적 산출</v-tab>
            <v-tab value="tab2">결과 조회</v-tab>
          </v-tabs>
        </v-sheet>

        <v-window v-model="tab" class="h-window">
          <!-- 탭1 -->
          <v-window-item value="tab1">
            <div class="h-grow">
              <v-sheet width="50%" class="pa-0 h-auto mr-3 mt-1">
                <!-- 실적산출 버튼 -->
                <IGridTitle
                  ref="menuTitle2"
                  class="mt-2"
                  :button-list="['btnUpdate']"
                  @click-button="onButtonsClick2"
                >
                </IGridTitle>
                <RealGrid
                  ref="grdMain"
                  :grid-view-option="grdMainProps.gridViewOption"
                  :keys="grdMainProps.keys" 
                  :fields="grdMainProps.fields"
                  :columns="grdMainProps.columns"
                />
              </v-sheet>
            </div>
          </v-window-item>

          <!-- 탭2 -->
          <v-window-item value="tab2">
            <div class="h-grow">
              <v-sheet width="50%" class="pa-0 h-auto mr-3">
                  <!-- 결과조회 버튼 -->
                  <!-- <IGridTitle
                    class="mt-2"
                    :button-list="['btnUpdate']"
                    @click-button="onButtonsClick3"
                  >
                  </IGridTitle> -->
                  <v-sheet class="d-flex justify-end align-center mb-2">
                    <IButtonList
                      ref="menuTitle2"
                      class="mt-2"
                      :button-list="['btnPrint']"
                      @click-button="onButtonsClick3"
                    >
                    </IButtonList>
                  </v-sheet>
                <RealGrid
                  ref="grdSub"
                  :grid-view-option="grdSubProps.gridViewOption"
                  :keys="grdSubProps.keys" 
                  :fields="grdSubProps.fields"
                  :columns="grdSubProps.columns"
                />
              </v-sheet>
            </div>
          </v-window-item>

        </v-window>
      </div>
    </v-card-text>
    <VendTreePopup ref="vendTreePopup" @selected="selectedVend"/>
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
  width: 49px;
  height: 10px;
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


