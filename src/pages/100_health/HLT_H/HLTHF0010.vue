<!--
  화면명 : 안전보호구 정기신청 마감관리
  화면개요 : (안전화, 도수보안경, 안전장화) 정기신청 관리
-->

<script setup>

import { ref, reactive, onMounted, getCurrentInstance, computed } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import IMenuTitle from '@/components/IMenuTitle.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import RealGrid from '@/components/RealGrid.vue'

import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
} from '@hiway/api/commonApi'
import HLTHF0010Popup01 from './HLTHF0010Popup01.vue'


defineOptions({
  name: '100_health-HLT_H-HLTHF0010',
})

const codeList = reactive({
  //구분
  division: [],
  reqCha: [],
})

const userStore = useUserStore()
const userLogStore = useLogsStore()
const menuTitle = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const hLTHF0010Popup01 = ref(null)
const grdMain = ref(null)
const selectDiv = ref('')

const searchData = () => {
  return commonSearchApi({
    queryId: 'HLTHF0010_SEARCH_01',
    param: searchParam,
  })
}

const initCodeList = async() => {
  Promise.all([
    //구분
    getCodeList('HHII710'),
    //차수
    getCodeList('HHII809'),

  ]).then((res) => {
    console.log('res', res)
    codeList.division = res[0].ORESULT_CUR
    codeList.reqCha = res[1].ORESULT_CUR
    grdMain.value.setBindingColumn('DIVISION', codeList.division, 'COD', 'TXT')
    grdMain.value.setBindingColumn('REQ_CHA', codeList.reqCha, 'COD', 'TXT')
  })
}

const changeReqCha = () =>{
  
  const div = searchParam.DIVISION
  const systemCode = ref('');
  selectDiv.value = div;

  switch(div){
    case 'A':
      systemCode.value = 'HHII809'
      break
    case 'B':
      systemCode.value = 'HHII806'
      break
    case 'C':
      systemCode.value = 'HHII807'
      break
  }

  Promise.all([
    getCodeList(systemCode.value),
  ]).then((res)=>{
    codeList.reqCha = res[0].ORESULT_CUR
    grdMain.value.setBindingColumn('REQ_CHA', codeList.reqCha, 'COD', 'TXT')
  })
}

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  DIVISION: 'A',
})

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'YEAR',
      dataType: 'text',
      width: '20',
      editable: false,
      header: { text: t('연도') },
    },
    {
      fieldName: 'REQ_CHA',
      dataType: 'text',
      width: '20',
      editable: false,
      header: { text: t('차수') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'ST_DATE',
      dataType: 'text',
      width: '35',
      editable: false,
      header: { text: t('시작일') },
    },
    {
      fieldName: 'EN_DATE',
      dataType: 'text',
      width: '35',
      editable: false,
      header: { text: t('마감일') },
    },
    {
      fieldName: 'RECEIVE_ST_DATE',
      dataType: 'text',
      width: '35',
      editable: false,
      header: { text: t('시작일') },
    },
    {
      fieldName: 'RECEIVE_EN_DATE',
      dataType: 'text',
      width: '35',
      editable: false,
      header: { text: t('마감일') },
    },
    {
      fieldName: 'COM_ENT_DATE',
      dataType: 'text',
      width: '35',
      editable: false,
      visible: false,
      header: { 
        text: t('협력사 지급기준\n입사일자(~까지)'),
        styleName: "multiline-editor",
      },
    },
    {
      fieldName: 'REMARKS',
      width: '150',
      styleName: 'left-column',
      editor: {
        type: 'multiline',
        maxLength: 0, //입력길이제한 x
        height: 200,
      },
      header: { text: t('비고') },
    },
    //안보이는컬럼
    {
      fieldName: 'CMPNY_DIV',
      visible: false,
      header: { text: t('사업장구분') },
    },
    {
      fieldName: 'DIVISION',
      visible: false,
      header: { text: t('안전보호구 구분') },
    },
  ],
  columns: [],
  columnLayout: [
    'YEAR',
    'REQ_CHA',
    {
      name: '신청기간',
      direction: 'horizontal',
      items: ['ST_DATE', 'EN_DATE'],
    },
    {
      name: '지급기간',
      direction: 'horizontal',
      items: ['RECEIVE_ST_DATE', 'RECEIVE_EN_DATE'],
    },
    'COM_ENT_DATE',
    'REMARKS',
  ],
})

grdMainProps.columns = grdMainProps.fields


onMounted(async() => {
  await initCodeList()
  //onButtonsClick({ id: 'btnSearch' })
  selectDiv.value = searchParam.DIVISION
  grdMain.value.getGridView().filterPanel.visible = true
})

const onButtonsClick = async(btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  } else if (btn.id === 'btnCreate') {
    hLTHF0010Popup01.value.openPopup(selectDiv.value)
  } else {
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  }
}

const afterSearch = (res) => {

  const gridView = grdMain.value.getGridView();
 
  gridView.setAllCheck(false)
  gridView.checkAll(false)

  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  changeReqCha()
}

const beforeDelete = () => {
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  if (checkedData.length === 0) {
    Message.warn(t('삭제할 데이터를 선택해주세요.'))

    return false
  }
  return true
}

const deleteData = () => {
  let deleteParam = []
  let chkNum = grdMain.value.getGridView().getCheckedRows(true)

  for (let i = 0; i < chkNum.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(chkNum[i])
    let deleteData = {
      CMPNY_DIV: data.CMPNY_DIV,
      YEAR: data.YEAR,
      DIVISION: data.DIVISION,
      REQ_CHA: data.REQ_CHA,
      USER_ID: userStore.userId,
    }

    deleteParam.push(deleteData)
  }

  return commonExecuteApi({
    queryId: 'HLTHF0010_DELETE_01',
    list: deleteParam,
  })
}

const afterDelete = () => {
  onButtonsClick({ id: 'btnSearch' })
}

//그리드 셀 더블클릭 이벤트
const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  hLTHF0010Popup01.value.openPopup2(data,selectDiv.value)
}

const selectDivision = async() => {
  await onButtonsClick({ id: 'btnSearch' })
}

</script>

<template>
    <v-card class="pa-0 fill-height">
        <v-card-title class="pa-3 pb-0">
            <IMenuTitle
                ref="menuTitle"
                :title="$t(useLogsStore().menuId)"
                :button-list="['btnSearch', 'btnCreate', 'btnDelete']"
                @click-button="onButtonsClick"
                :use-permission="true"
            />
        </v-card-title>
        <v-card-text class="pa-3 pt-0 content-area">
            <div class="d-flex flex-column fill-height">
                <v-sheet class="searchArea">
                <div class="d-flex">
                    <i-select
                    :label="$t('구분')"
                    :items="codeList.division"
                    item-title="TXT"
                    item-value="COD"
                    width="300px"
                    labelWidth="50px"
                    v-model="searchParam.DIVISION"
                    @update:modelValue = "selectDivision"
                    >
                    </i-select>
                </div>
                </v-sheet>
                <v-sheet class="pa-0 h-auto">
                    <RealGrid
                        ref="grdMain"
                        :grid-view-option="grdMainProps.gridViewOption"
                        :fields="grdMainProps.fields"
                        :columns="grdMainProps.columns"
                        :column-layout="grdMainProps.columnLayout"
                        @onCellDblClicked="onCellDblClicked"
                    >
                    </RealGrid>
                </v-sheet>
            </div>
        </v-card-text>
    </v-card>
    <HLTHF0010Popup01
    @Saved="() => onButtonsClick({ id: 'btnSearch' })"
    ref="hLTHF0010Popup01"
  ></HLTHF0010Popup01>
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

.multi-line-css {
  white-space: pre;
}
</style>
    
