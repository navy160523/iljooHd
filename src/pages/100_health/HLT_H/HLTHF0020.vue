<script setup>
import {ref, reactive, onMounted, getCurrentInstance, computed} from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import Message from '@hiway/utils/notify'
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import {
  commonSearchApi,
  commonExecuteApi,
  getCodeList,
} from '@hiway/api/commonApi'
import HLTHF0020Popup02 from './HLTHF0020Popup02.vue'

defineOptions({
  name: '100_health-HLT_H-HLTHF0020',
})

const grdMain = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const userLogStore = useLogsStore()
const menuTitle = ref(null)
const dataRes = ref()
const hLTHF0020Popup02 = ref(null)
const selectDiv = ref('')

const codeList = reactive({
    //구분
    division: [],
    //품명
    itemName: [],
    //모델
    model: [],
    YN: [
      { TXT: "사용", COD: "N" },
      { TXT: "사용중지", COD: "Y" },
    ],
})

const searchParam = reactive({
    CMPNY_DIV: userStore.cmpnyDiv,
    DIVISION: '',
    ITEM_NAME: '',
    MODEL: '',
    DELETE_YN: 'N'
})

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'DIVISION',
      dataType: 'text',
      width: '40',
      editable: false,
      header: { text: t('구분') },
      lookupDisplay: true,
      styleName: 'left-column',
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'ITEM_NAME',
      dataType: 'text',
      width: '100',
      editable: false,
      header: { text: t('품명') },
      lookupDisplay: true,
      styleName: 'left-column',
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'MODEL',
      dataType: 'text',
      width: '100',
      editable: false,
      styleName: 'left-column',
      header: { text: t('모델명') },
    },
    {
      fieldName: 'PASS_NO',
      dataType: 'text',
      width: '50',
      editable: false,
      styleName: 'left-column',
      header: { text: t('합격번호') },
    },
    {
      fieldName: 'MAT_NO',
      dataType: 'text',
      width: '50',
      editable: false,
      styleName: 'left-column',
      header: { text: t('자재번호') },
    },
    {
      fieldName: 'COST',
      dataType: 'number',
      numberFormat: '#,###.##',
      width: '50',
      editable: false,
      styleName: 'right-column',
      header: { text: t('단가') },
    },
    {
      fieldName: 'VEND',
      dataType: 'text',
      width: '90',
      editable: false,
      header: { text: t('납품업체') },
      styleName: 'left-column',
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'DELETE_YN',
      dataType: 'text',
      width: '30',
      editable: false,
      lookupDisplay: true,
      header: { text: t('현재상태') },
    },
    //안보이는컬럼
    {
      fieldName: 'CAUTION',
      visible: false,
      header: { text: t('주의사항') },
    },
    {
      fieldName: 'REMARK',
      visible: false,
      header: { text: t('비고') },
    },
    {
      fieldName: 'ITEM_SEQ',
      dataType: 'number',
      visible: false,
      header: { text: t('순번') },
    },
    {
      fieldName: 'CMPNY_DIV',
      visible: false,
      header: { text: t('사업장구분') },
    },
    {
      fieldName: 'ORDER_NUM',
      dataType: 'text',
      visible: false,
      editable: false,
      header: { text: t('정렬순서') },
    },
    {
      fieldName: 'FILE_ID',
      dataType: 'text',
      visible: false,
      editable: false,
      header: { text: t('이미지(사진)') },
      styleCallback: function (grid, dataCell) {
        let ret = {}
        const iconSize = 16
        if (dataCell.value) {
          ret.renderer = {
            type: 'icon',
            iconLocation: 'center',
            iconCallback: function (grid, cell) {
              return new URL(
                '/src/assets/images/icons/file-plus-outline.png',
                import.meta.url
              ).href
            },
            iconHeight: iconSize,
            iconWidth: iconSize,
          }
        }
        return ret
      },
    },
    {
      fieldName: 'MAIN_FILE_NO',
      dataType: 'text',
      visible: false,
      editable: false,
      header: { text: t('대표 이미지') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

const itemSearchParam = reactive({
    ALL_UP_CD : "HHII710A/HHII710B/HHII710C",
    CMPNY_DIV : "HHI",
    USE_FLAG : "Y",
    CODE_NAME_TYPE : "0",
    LEVEL : null,
})

const itemSearchData = (queryId,allUpCd) =>{
  itemSearchParam.ALL_UP_CD = allUpCd
    return commonSearchApi({
        queryId: queryId,
        param:itemSearchParam,
    })
}

const searchData = () => {
  return commonSearchApi({
    queryId: 'HLTHF0020_SEARCH_01',
    param: searchParam,
  })
}

const initCodeList = () =>{
    Promise.all([
        //구분
        getCodeList('HHII710'),
        //품명
        itemSearchData('HLTHF0020_SEARCH_COMMONCODE','HHII710A'),
        itemSearchData('HLTHF0020_SEARCH_COMMONCODE','HHII710B'),
        itemSearchData('HLTHF0020_SEARCH_COMMONCODE','HHII710C'),
        //품명 전체
        itemSearchData('HLTHF0020_SEARCH_COMMONCODE','HHII710A/HHII710B/HHII710C'),
    ]).then((res)=>{
        dataRes.value = res
        codeList.division = [...dataRes.value[0].ORESULT_CUR]
        codeList.itemName = [...dataRes.value[4].ORESULT_CUR]
        codeList.division.unshift({ TXT: '전체', COD: ''})
        codeList.itemName.unshift({ TXT: '전체', COD: ''})
        grdMain.value.setBindingColumn('DIVISION', codeList.division, 'COD', 'TXT')
        grdMain.value.setBindingColumn('ITEM_NAME', codeList.itemName, 'COD', 'TXT')
        grdMain.value.setBindingColumn('DELETE_YN', codeList.YN, 'COD', 'TXT')
    })
}

onMounted(() => {
  initCodeList()
  //onButtonsClick({ id: 'btnSearch' })
  grdMain.value.getGridView().filterPanel.visible = true
})

const onButtonsClick = async (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  } else if (btn.id === 'btnCreate') {
    hLTHF0020Popup02.value.openPopup(selectDiv.value, dataRes.value, false)
  } else if (btn.id === 'btnDelete'){
    new deleteFlowHelper(vm, t)
      .setBefore(beforeDelete)
      .setQuery(deleteData)
      .setAfter(afterDelete)
      .run()
  }
}

const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  hLTHF0020Popup02.value.openPopup(data.DIVISION, dataRes.value, data, true)
}

//삭제 전 유효성 검사
const beforeDelete = () => {
  return true
}

//삭제 이벤트
const deleteData = async () => {
  let temp = null
  let checkedRows = grdMain.value.getGridView().getCheckedRows(true)
  for (let rowIdx of checkedRows) {
    let data = grdMain.value.getDataProvider().getJsonRow(rowIdx)
    let deleteParam = [{
      CMPNY_DIV: data.CMPNY_DIV,
      ITEM_SEQ : data.ITEM_SEQ,
      DIVISION : data.DIVISION,
      USER_ID  : userStore.userId
    }]
    temp = commonExecuteApi({ queryId : 'HLTHF0020_DELETE_01', list: deleteParam }) 
  }
  return temp
}

//삭제 후
const afterDelete = async () => {
  await onButtonsClick({ id: 'btnSearch' })
}

const afterSearch = (res) => {
  const gridView = grdMain.value.getGridView();
 
  gridView.setAllCheck(false)
  gridView.checkAll(false)

  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const selectDivision =  async() =>{

  codeList.itemName = []

  selectDiv.value = searchParam.DIVISION

  switch(searchParam.DIVISION){
    case '':
      codeList.itemName = [...dataRes.value[4].ORESULT_CUR]
      break
    case 'A':
      codeList.itemName = [...dataRes.value[1].ORESULT_CUR]
      break
    case 'B':
      codeList.itemName = [...dataRes.value[2].ORESULT_CUR]
      break
    case 'C':
      codeList.itemName = [...dataRes.value[3].ORESULT_CUR]
      break
  }

  codeList.itemName.unshift({ TXT: '전체', COD: ''})
  grdMain.value.setBindingColumn('ITEM_NAME', codeList.itemName, 'COD', 'TXT')

  searchParam.ITEM_NAME = ''
  onButtonsClick({ id: 'btnSearch' })

}

const selectItem = async() =>{
  onButtonsClick({ id: 'btnSearch' })
}

const selectYn = async () => {
  onButtonsClick({ id: 'btnSearch' })
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
            <i-select
              :label="$t('품명')"
              :items="codeList.itemName"
              item-title="TXT"
              item-value="COD"
              width="300px"
              labelWidth="50px"
              v-model="searchParam.ITEM_NAME"  
              @update:modelValue = "selectItem"
            >
            </i-select>
            <i-input
              :label="$t('모델명')"
              width="300px"
              labelWidth="50px"
              v-model="searchParam.MODEL"  
              @keydown.enter="onButtonsClick({ id: 'btnSearch' })"
            >
            </i-input>
            <v-checkbox
              true-value="Y"
              false-value="N"
              v-model="searchParam.DELETE_YN"
              @update:modelValue = "selectYn"
            >
            </v-checkbox>
            <span class="mt-1">사용중지 포함</span>
          </div>
        </v-sheet>
        <div class="h-grow">
            <v-sheet class="pa-0 h-auto">
                <RealGrid
                    ref="grdMain"
                    :grid-view-option="grdMainProps.gridViewOption"
                    :fields="grdMainProps.fields"
                    :columns="grdMainProps.columns"
                    @onCellDblClicked = "onCellDblClicked"
                >
                </RealGrid>
            </v-sheet>
        </div>
      </div>
    </v-card-text>
  </v-card>
  <HLTHF0020Popup02
    @Saved="() => onButtonsClick({ id: 'btnSearch' })"
    ref="hLTHF0020Popup02"
  ></HLTHF0020Popup02>

  <!-- <CarouselImageViewerPopup
    ref="carouselImageViewerPopup"
    width="1200"
    height="800"
  ></CarouselImageViewerPopup> -->
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
</style>