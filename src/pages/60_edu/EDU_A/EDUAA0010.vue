<!--
  화면명 : 강사 관리
  화면개요 : 강사 관리 조회 추가 삭제 하는 화면
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, getCodeList, commonExecuteApi,commonLogExecuteApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import EDUAA0010Pop01 from '@/pages/60_edu/EDU_A/EDUAA0010Pop01.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from "@/utils/deleteFlowHelper"
import _ from 'lodash'

defineOptions({
  name:'60_edu-EDU_A-EDUAA0010',
})

//*******************************************세팅 영역***************************************************/

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore()
const t = useI18n().t //다국어
const eDUAA0010Pop01 = ref(null)
const menuTitle = ref(null)
const grdMain = ref(null)
const empPopup = ref(null)
const userId = ref(userStore.userId)
const searchArea = ref(null)
const { sliEDUAA0010 } = history.state
const isMounted = ref(false)

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  DIVISION: '',
  NAME: '',
  DELETE_YN: 'N',
  USER_ID: userId,
  //2023.12.22 박용훈 ip 추가
  //IP_ADDRESS: null,
  IP_ADDRESS: userStore.clientIp,
  BSNS_CD: '',
  DEPT_CD: '',
  SLI_YN: 'N',
})

//코드리스트 세팅 
const codeList = reactive({
  DIVISION: [],
  BSNS_CD: [], // 사업부
  DEPT_CD:[], // 부서
})

watch(() => searchParams.BSNS_CD, newValue => {
  if(isMounted.value) {
    commonSearchApi({
      queryId: 'searchDept3',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        BSNS_CD: newValue,
        USE_DIV: 'Y',
      },
    }).then(res => {
      searchParams.DEPT_CD = ''
      codeList.DEPT_CD = res.ORESULT_CUR
      codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
    }) 
  }
  // else {
  //   searchParams.DEPT_CD = ''
  //   codeList.DEPT_CD = []
  //   codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
  // }
})

//콤보박스 및 그리드 데이터 바인딩
const initCodeList = async () => {
  await Promise.all([
    getCodeList('HHID160'),
    commonSearchApi({
      queryId: 'searchBSNS',
      param: {
        CMPNY_DIV: userStore.cmpnyDiv,
        USE_DIV: 'N',
      },
    })
  ]).then(res => {
    codeList.DIVISION = res[0].ORESULT_CUR
    codeList.DIVISION.unshift({ TXT: "전체", COD: "" })
    grdMain.value.setBindingColumn("DIVISION", res[0].ORESULT_CUR, "COD", "TXT") 

    codeList.BSNS_CD = _.cloneDeep(res[1].ORESULT_CUR)
    codeList.BSNS_CD.unshift({ BSNS_NM: '전체', BSNS_CD: '' })
    codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })

    if(sliEDUAA0010 !== undefined) {
      searchParams.BSNS_CD = sliEDUAA0010.BSNS_CD
      searchParams.DEPT_CD = sliEDUAA0010.DEPT_CD
      searchParams.DIVISION = 'A'
      searchParams.SLI_YN = 'Y'

      commonSearchApi({
        queryId: 'searchDept3',
        param: {
          CMPNY_DIV: userStore.cmpnyDiv,
          BSNS_CD: searchParams.BSNS_CD,
          USE_DIV: 'Y',
        },
      }).then(res => {
        codeList.DEPT_CD = res.ORESULT_CUR
        codeList.DEPT_CD.unshift({ DEPT_NM: '전체', DEPT_CD: '' })
      }) 
    }
  })
}

//그리드 세팅
const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true }, stateBar: { visible:false } }, 
  fields : [ 
    { fieldName: 'DIVISION', dataType: 'text', width:'50', ReadOnly: true, header: { text: t('구분') },
      lookupDisplay: true, editable: false },
    { fieldName: 'NAME', dataType: 'text', width:'50', header: { text: t('강사명') }, editable: false},
    { fieldName: 'ASGN_NM', dataType: 'text', header: { text: t('소속') }, editable: false, styleName: 'left-column' },
    { fieldName: 'JOB_TIT_NM', dataType: 'text', width:'50', header: { text: t('직위') }, editable: false },
    { fieldName: 'MOBILE', dataType: 'text', header: { text: t('연락처') }, editable: false, visible : false  },
    { fieldName: 'EMAIL', dataType: 'text', header: { text: t('이메일') }, editable: false, visible : false  },
    { fieldName: 'CURRICULUM', dataType: 'text', header: { text: t('주요 강좌') }, editable: false, styleName: 'left-column'  },
    { fieldName: 'DELETE_YN', dataType: 'text' , width:'50', header: { text: t('삭제 여부') }, editable: false  },
    { fieldName: 'RETIRED_YN', dataType: 'text', width:'50', header: { text: t('퇴직 여부') }, editable: false  },
    { fieldName: 'SLI_YN2', dataType: 'text', width:'50', header: { text: t('SLI 가점대상') }, editable: false  },
    { fieldName: 'FILE_CNT', dataType: 'text', width:'50', header: { text: t('첨부 파일') }, editable: false
      ,
      renderer: {
      type: "html",
        callback: function (grid, cell, w, h) {
          let str = ''
          if(cell.value === '0'){
            str = `
            <div style="display: flex; justify-content: center;
            padding-left: 10px; padding-right: 10px">
            </div>
            `
          }else{
            str = `
            <div style="display: flex; justify-content: center;
            padding-left: 10px; padding-right: 10px">
              <p>${cell.value}&nbsp;&nbsp;</p>
              <span class="mdi mdi-file-check-outline text-light-blue-darken-1" style="font-size: 21px;"></span>
            </div>
            `
          }
            
          return str
        },
      }, },

    //출력 안함
    { fieldName: 'CMPNY_DIV', dataType: 'text', visible: false },
    { fieldName: 'LECTURER_ID', dataType: 'text', visible: false },
    { fieldName: 'EDU_DATA_DIFF_YN', dataType: 'text', visible: false },
    { fieldName: 'FILE_ID', dataType: 'text', visible: false },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

//*******************************************세팅 영역(종료)***************************************************/


//*******************************************이벤트 영역******************************************************/
//버튼 이벤트
const onButtonsClick = async btn => {
  if (btn.id === 'btnSearch') {       //조회
    grdMain.value.getDataProvider().setRows([])
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      //.setSearchArea(searchArea)
      .setBefore(beforeSearch)
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } 
  else if (btn.id === 'btnCreate') {  //추가
    eDUAA0010Pop01.value.openPopup({
      CREATE_YN: 'Y',
    })
  } 
  else if(btn.id === 'btnDelete'){    //삭제
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  }
}


//로우 더블 클릭시 발생하는 이벤트
const cellDbClick = (grid, data) => {
  let row =  grdMain.value.getDataProvider().getJsonRow(data.dataRow)

  eDUAA0010Pop01.value.openPopup({
    CREATE_YN : 'N',
    LECTURER_ID: row.LECTURER_ID,  //강사 일련번호
  })

}


const onSavedDetailData = () => {
  onButtonsClick({ id : 'btnSearch' })
}

//그리드 초기화 이벤트
const gridRefresh = () => {
  grdMain.value.getDataProvider().setRows([])
}
//*******************************************이벤트 영역(종료)******************************************************/


//*********************************************조회 영역**************************************************************/
//조회 전 유효성 검사
const beforeSearch = () => {
  return true
}

//조회
const searchData = idx => {
  return commonSearchApi({ queryId : 'EDUAA0010_SEARCH_01', param: searchParams })
}

//조회 후
const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  console.log('res',rse)
  // 2023.12.22 박용훈 공통으로 사용하기 위해서 수정함.
  /*
  var logData = {
    CMPNY_DIV : userStore.cmpnyDiv,
    USER_ID : userStore.userId,
    CONN_GBN : 'WEB',
    CONN_IP : userStore.clientIp,
    CONN_COMMENT: '[' + t(useLogsStore().menuId) + '] 화면 - 개인정보관련 조회했습니다.(조회조건:CMPNY_DIV=' 
    + searchParams.CMPNY_DIV + ',DIVISION=' + searchParams.DIVISION + ', NAME=' + searchParams.NAME + ')',
    CRUD_GBN: '',
    LOG_DESC: '',
    MENU_ID : useLogsStore().menuId,
  }

  console.log("로그 데이터 확인",logData)
  commonExecuteApi({ queryId : 'EDUAA0010_SAVE_LOG', list: [logData] })
  */
  var params = {
    userStore : userStore,
    params : searchParams,
    mgs : '개인정보관련 조회했습니다.',
    crudGbn : 'R', //행위구분(C:생성, R :조회, U:수정, D:삭제, CU:생성/수정, P:출력, L:로그인)
    logDesc : '', // 사유입력
    menuId : useLogsStore().menuId,
    menuNm : t(useLogsStore().menuId),
  }
  commonLogExecuteApi(params)
}

//*********************************************조회 영역(종료)**************************************************************/

//*********************************************삭제 영역**************************************************************/
//삭제 전 유효성 검사
const beforeDelete = () => {
  return true
}

//삭제 이벤트
const deleteData = () => {
  let deleteParams = []
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    deleteParams.push(data)
  }

  return commonExecuteApi({ queryId : 'EDUAA0010_DELETE_01', list: deleteParams })
}

//삭제 후
const afterDelete = () => {
  commonSearchApi({ queryId : 'EDUAA0010_SEARCH_01', param: searchParams }).then(res => {
    if(res.ORESULT_CUR.length > 0 ){
      grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
    }else{
      grdMain.value.getDataProvider().setRows([])
    }
    
  })
}

//*********************************************삭제 영역(종료)**************************************************************/
onMounted(async () => {
  await initCodeList()
  
  //강사 이력이 1년 이상 없는 데이터일 경우 주황색으로 표시
  grdMain.value.getGridView().setRowStyleCallback(function(grid, item, fixed) {
    var ret = {}

    var gender = grid.getValue(item.index, "EDU_DATA_DIFF_YN")

    if (gender == 'N') {
      ret.editable = false
      ret.style = { background:"#D9E5FF" }// ret.style = {background:"#ffff00"} 직접 스타일 적용 가능
    }

    return ret
  })

  onButtonsClick({ id:'btnSearch' })

  isMounted.value = true
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <!-- 타이틀 영역 
            타이틀에 추가 컴포넌트를 넣을 예정이라면 content-area 클래스의 height 설정을 변경해주세요. -->
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
        :button-list="['btnSearch', 'btnCreate', 'btnDelete']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- content-area 해당 클래스의 이름은 필수 입니다. 
          다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
    <v-card-text class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            :label="$t('구분')"
            width="150px"
            v-model="searchParams.DIVISION"
            :items="codeList.DIVISION"
            item-title="TXT"
            item-value="COD"
            @update:model-value = gridRefresh()
          />
          <i-input 
            :label="$t('강사명')"
            width="250px"
            v-model="searchParams.NAME"
            @keydown.enter="() => onButtonsClick({ id : 'btnSearch' })"
            oninput="javascript: this.value = this.value.replace(/[a-z|A-Z~`!@#$%^&*()_+|<>?:{}]/, '');"
            @update:model-value = gridRefresh()
          />
          <i-select
            v-model="searchParams.BSNS_CD"
            :label="$t('사업부')"
            :items="codeList.BSNS_CD"
            item-value="BSNS_CD"
            item-title="BSNS_NM"
            width="250px"
            label-width="50px"
          />
          <i-select
            v-model="searchParams.DEPT_CD"
            :label="$t('부서')"
            :items="codeList.DEPT_CD"
            item-value="DEPT_CD"
            item-title="DEPT_NM"
            width="300px"
            label-width="35px"
          />
          <v-checkbox
            class="mr-5"
            :label="$t('삭제/퇴직인원 포함')"
            v-model="searchParams.DELETE_YN"
            @update:model-value = gridRefresh()
          />
          <v-checkbox
            :label="$t('SLI 가점대상')"
            v-model="searchParams.SLI_YN"
            true-value="Y"
            false-value="N"
            @update:model-value = gridRefresh()
          />
        </v-sheet>
        <!-- height : 직접 지정하고싶은 높이를 설정합니다.
                      만약 높이를지정하지 않으면 각 컨텐츠의 크기만큼 영역을 가집니다. -->
        <v-sheet height="90%" class="mb-2">
          <IGridTitle :title="$t('강사 리스트')">
            <template #editors>※강의 이력이 1년 이상 없는 강사는 하늘색으로 표시됩니다.※</template>
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellDblClicked ="cellDbClick"
          />
        </v-sheet>
      </div>
    </v-card-text>
    <!-- 부서/ 협력사 팝업 -->
    <EDUAA0010Pop01
      ref="eDUAA0010Pop01"
      @saved="onSavedDetailData"
    />
  </v-card>
</template>
<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (205px - 12px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - (205px - 12px));
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>
