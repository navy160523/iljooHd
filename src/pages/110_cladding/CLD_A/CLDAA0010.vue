<script setup>
import { ref, reactive, onMounted, getCurrentInstance, computed } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import queryFlowHelper from '@/utils/searchFlowHelper'
import deleteFlowHelper from '@/utils/deleteFlowHelper'
import RealGrid from '@/components/RealGrid.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { commonSearchApi, commonExecuteApi, getCodeList } from '@hiway/api/commonApi'
import CLDAA0010Popup01 from './CLDAA0010Popup01.vue'
import CarouselImageViewerPopup from '@/components/popup/CarouselImageViewerPopup.vue'

defineOptions({
  name: '110_cladding-CLD_A-CLDAA0010',
})

const userStore = useUserStore()
const userLogStore = useLogsStore()
const menuTitle = ref(null)
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const cLDAA0010Popup01 = ref(null)
const grdMain = ref(null)
const carouselImageViewerPopup = ref(null)

const searchParam = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  WARE_NAME: '',
  MODEL: '',
  DELETE_YN: 'N',
})

const codeList = reactive({
  //품명
  wareName: [],
  //구분1
  gubun1: [],
  //구분2
  gubun2: [],
  //납품업체
  vendSeq: [],
})

const initCodeList = () => {
  Promise.all([
    //품명
    getCodeList('HHIT010'),
    //구분(1)
    getCodeList('HHIT020'),
    //구분(2)
    getCodeList('HHIT030'),
    //납품업체
    getCodeList('HHIT040'),
  ]).then((res) => {
    console.log('res', res)
    codeList.wareName = res[0].ORESULT_CUR
    codeList.gubun1 = res[1].ORESULT_CUR
    codeList.gubun2 = res[2].ORESULT_CUR
    codeList.vendSeq = res[3].ORESULT_CUR
    codeList.wareName.unshift({ TXT: '전체', COD: '' })
    grdMain.value.setBindingColumn('WARE_NAME', codeList.wareName, 'COD', 'TXT')
    grdMain.value.setBindingColumn('GUBUN1', codeList.gubun1, 'COD', 'TXT')
    grdMain.value.setBindingColumn('GUBUN2', codeList.gubun2, 'COD', 'TXT')
    grdMain.value.setBindingColumn('VEND_SEQ', codeList.vendSeq, 'COD', 'TXT')
  })
}

const grdMainProps = reactive({
  gridViewOption: { checkBar: { visible: true } },
  fields: [
    {
      fieldName: 'WARE_NAME',
      dataType: 'text',
      width: '50',
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
      fieldName: 'VEND_SEQ',
      dataType: 'text',
      width: '50',
      editable: false,
      header: { text: t('납품업체') },
      styleName: 'left-column',
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'GUBUN1',
      dataType: 'text',
      width: '30',
      editable: false,
      header: { text: t('구분(1)') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'GUBUN2',
      dataType: 'text',
      width: '30',
      editable: false,
      header: { text: t('구분(2)') },
      lookupDisplay: true,
      editor: {
        type: 'dropdown',
      },
    },
    {
      fieldName: 'COST',
      dataType: 'number',
      numberFormat: '#,###.##',
      width: '30',
      editable: false,
      styleName: 'right-column',
      header: { text: t('단가') },
    },
    {
      fieldName: 'DELETE_YN',
      dataType: 'text',
      width: '30',
      editable: false,
      header: { text: t('등록/삭제') },
    },
    {
      fieldName: 'ORDER_NUM',
      dataType: 'text',
      width: '30',
      editable: false,
      header: { text: t('정렬순서') },
    },
    {
      fieldName: 'FILE_ID',
      dataType: 'text',
      width: '30',
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
              return new URL('/src/assets/images/icons/file-plus-outline.png', import.meta.url).href
            },
            iconHeight: iconSize,
            iconWidth: iconSize,
          }
        }

        return ret
      },
    },
    //안보이는컬럼
    {
      fieldName: 'CMPNY_DIV',
      visible: false,
      header: { text: t('사업장구분') },
    },
    {
      fieldName: 'USE',
      visible: false,
      header: { text: t('용도') },
    },
    {
      fieldName: 'CLOTHES_SEQ',
      visible: false,
      header: { text: t('피복순번') },
    },
    {
      fieldName: 'USER_DIV',
      visible: false,
      header: { text: t('조직구분') },
    },
  ],
  columns: [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {
  initCodeList()
  grdMain.value.getGridView().filterPanel.visible = true
})

const onButtonsClick = (btn) => {
  if (btn.id === 'btnSearch') {
    new queryFlowHelper(vm, t).setQuery(searchData).setAfter(afterSearch).run()
  } else if (btn.id === 'btnCreate') {
    cLDAA0010Popup01.value.openPopup()
  } else {
    new deleteFlowHelper(vm, t).setBefore(beforeDelete).setQuery(deleteData).setAfter(afterDelete).run()
  }
}

//삭제관련 로직 시작
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
  let checkedData = grdMain.value.getGridView().getCheckedRows(true)
  for (let i = 0; i < checkedData.length; i++) {
    let data = grdMain.value.getDataProvider().getJsonRow(checkedData[i])
    let deleteData = {
      CMPNY_DIV: data.CMPNY_DIV, //회사구분
      CLOTHES_SEQ: data.CLOTHES_SEQ, //피복순번
    }
    deleteParam.push(deleteData)
  }

  return commonExecuteApi({
    queryId: 'CLDAA0010_DELETE_01',
    list: deleteParam,
  })
}

const afterDelete = () => {
  onButtonsClick({ id: 'btnSearch' })
}
//삭제관련 로직 끝

const searchData = () => {
  return commonSearchApi({
    queryId: 'CLDAA0010_SEARCH_01',
    param: searchParam,
  })
}

const afterSearch = (res) => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

//그리드 셀 클릭 이벤트
const onCellItemClicked = (grid, index, col) => {
  if (col.fieldName === 'FILE_ID') {
    carouselImageViewerPopup.value.openPopup(col.value)
  }
}

//그리드 셀 더블클릭 이벤트
const onCellDblClicked = (grid, clickData) => {
  let data = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
  cLDAA0010Popup01.value.openPopup2(data)
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
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea">
          <div class="d-flex">
            <i-select
              :label="$t('품명')"
              :items="codeList.wareName"
              item-title="TXT"
              item-value="COD"
              width="300px"
              labelWidth="50px"
              v-model="searchParam.WARE_NAME"
            >
            </i-select>
            <i-input :label="$t('모델명')" width="300px" labelWidth="50px" v-model="searchParam.MODEL"> </i-input>
            <v-checkbox true-value="Y" false-value="N" v-model="searchParam.DELETE_YN"> </v-checkbox>
            <span class="mt-1">삭제 건 포함</span>
          </div>
        </v-sheet>
        <v-sheet class="pa-0 h-auto">
          <IGridTitle :title="$t('피복 종류')" />
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            @onCellItemClicked="onCellItemClicked"
            @onCellDblClicked="onCellDblClicked"
          >
          </RealGrid>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
  <CLDAA0010Popup01 @Saved="() => onButtonsClick({ id: 'btnSearch' })" ref="cLDAA0010Popup01"></CLDAA0010Popup01>

  <CarouselImageViewerPopup ref="carouselImageViewerPopup" width="1200" height="800"></CarouselImageViewerPopup>
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
