<!--
  화면명 : MNGEB0010.vue
  화면개요 :법령 제개정 관리
-->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import queryFlowHelper from '@/utils/searchFlowHelper'
import MNGEB0010Popup from './MNGEB0010Popup.vue'
import Message from '@hiway/utils/notify'
import dayjs from 'dayjs'



defineOptions({
  name:'10_management-MNG_E-MNGEB0010',
})
 
const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore()
const menuTitle = ref(null)
const searchArea = ref(null)
const grdMain = ref(null)
const mNGEB0010Popup = ref(null)

//코드리스트
const codeList = reactive({
  statusList : [
                  { COD : '',   TXT : '전체'},
                  { COD : '10', TXT : '제·개정 내역 입수'},
                  { COD : '20', TXT : '조치 담당자 지정'},
                  { COD : '30', TXT : '법규 조치 (업무반영 및 공지)'},
                  { COD : '40', TXT : '완료'},
                ], //진행상태 콤보
  PART_GUBN : [],
  NOTICE_GUBN : [],
})

//파라미터 리스트
const paramList = reactive({
  CMPNY_DIV : userStore.cmpnyDiv,
  LAW_NM : '',
  STATUS : '',
})

//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { header: { height:60 }, edit: { editable: false } },
  keys : [],
  fields : [ 
    { fieldName: 'CMPNY_DIV', dataType: 'text', width: '200', visible : false , },
    { fieldName: 'LAW_CD', dataType: 'text', width: '200', visible : false , },
    { fieldName: 'LAW_NM', dataType: 'text', width: '120', header: { text: t('법령명') } , },
    { fieldName: 'PART_GUBN', dataType: 'text', width: '70', header: { text: t('해당부문') }, lookupDisplay: true    
      , lookupData: { value: "COD", label: "TXT", list: codeList.PART_GUBN },},
    { fieldName: 'ER_DATE', dataType: 'text', width: '80', visible : false , },
    { fieldName: 'PMG_DATE', dataType: 'text', width: '80', header: { text: t('공포일자') } , },
    { fieldName: 'ACT_DATE', dataType: 'text', width: '80', header: { text: t('시행일자') } , },
    { fieldName: 'ACQ_DATE', dataType: 'text', width: '80', header: { text: t('입수일') } , },
    { fieldName: 'BF_CONTENT', dataType: 'text', width: '300', header: { text: t('개정 전') }, styleName: 'multiline-editor left-column' , },
    { fieldName: 'AF_CONTENT', dataType: 'text', width: '300', header: { text: t('개정 후') }, styleName: 'multiline-editor left-column' , },
    { fieldName: 'STATUS', dataType: 'text', width: '120', header: { text: t('진행상태') }, styleName: 'multiline-editor left-column', lookupDisplay: true
      , lookupData: { value: "COD", label: "TXT", list: codeList.statusList },},
    { fieldName: 'SMNG_ID', dataType: 'text', visible : false , },
    { fieldName: 'SMNG_NM', dataType: 'text', width: '80', header: { text: t('법규관리자') } , },
    { fieldName: 'REV', dataType: 'text', visible : false , },
    { fieldName: 'WORK_YN', dataType: 'text', width: '100', header: { text: t('업무반영') }, lookupDisplay: true
      , lookupData: { value: "COD", label: "TXT", list: [{COD:'Y', TXT:'업무 반영'}, {COD:'N', TXT:'업무 미반영'}] }, },
    { fieldName: 'CHKLIST_YN', dataType: 'text', visible : false , },
    { fieldName: 'REMARK', dataType: 'text', visible : false } ,
    { fieldName: 'NOTICE_GUBN', dataType: 'text', width: '100', header: { text: t('법규 공지') }, lookupDisplay: true 
      , lookupData: { value: "COD", label: "TXT", list: codeList.NOTICE_GUBN },},
    { fieldName: 'NOTICE_CONTENT', dataType: 'text', visible : false , },
    { fieldName: 'CIR_LIST', dataType: 'text', visible : false , },
    { fieldName: 'SOL_DATE', dataType: 'text', visible : false , },
  ],
  columns : [],
  columnLayout: [
    'LAW_NM', 
    'PART_GUBN',
    'PMG_DATE',
    'ACT_DATE',
    'ACQ_DATE',
    {
      name: '법규 입수 내용',
      direction: 'horizontal',
      items: [
        'BF_CONTENT',
        'AF_CONTENT',
      ],
    },
    'STATUS',
    'SMNG_NM',
    {
      name: '법규 조치내역',
      direction: 'horizontal',
      items: [
        'WORK_YN',
        'NOTICE_GUBN',
      ],
    },
  ],
})
grdMainProps.columns = grdMainProps.fields


//콤보박스 설정
const initCombo = () => {  
  //해당부문 설정
  commonSearchApi({ queryId : 'LAW_DIV_SEARCH', param: { CMPNY_DIV : 'HHI', ALL_UP_CD : 'HHI.B', UP_CD : 'A', USE_FLAG : 'Y' } }).then(res => {
    codeList.PART_GUBN = res.ORESULT_CUR
    grdMain.value.setBindingColumn("PART_GUBN", codeList.PART_GUBN , "COD", "TXT") 
  })  

  //법규 공지
  commonSearchApi({ queryId : 'LAW_DIV_SEARCH', param: { CMPNY_DIV : 'HHI', ALL_UP_CD : 'HHI.C', UP_CD : 'A', USE_FLAG : 'Y' } }).then(res => {
    codeList.NOTICE_GUBN = res.ORESULT_CUR
    grdMain.value.setBindingColumn("NOTICE_GUBN", codeList.NOTICE_GUBN , "COD", "TXT")
  })
}

//신규팝업 등록후 처리
const onMNGEB0010PopupSaved = res =>{
  onButtonsClick({ id :'btnSearch' })
}

//메인 버튼 실행
const onButtonsClick = async btn => {
  if (btn.id === 'btnSearch')
  {
    new queryFlowHelper(vm, t)
      .setGridList([grdMain])
      .setQuery(searchData)
      .setAfter(afterSearch)
      .run()
  } 
  else if (btn.id === 'btnNew') {
    mNGEB0010Popup.value.openPopup({
      STATUS : '10'
    })
  }
}
const searchData = () => {
  return commonSearchApi({ queryId : 'MNGEB0010_SEARCH_01', param: paramList })
}

const afterSearch = res => {
  grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
}

const onCellDblClicked = (grid, clickData) => {
  if (clickData.cellType !== "header") {
    let rowData = grdMain.value.getDataProvider().getJsonRow(clickData.dataRow)
    let cirId = []
    let cirNm = []
    commonSearchApi({ queryId : 'SEARCH_EMPS', param: { EMP_NO : rowData.CIR_LIST, CMPNY_DIV : rowData.CMPNY_DIV } }).then(res =>{
      res.ORESULT_CUR.forEach(ele =>{
        cirId.push(ele.EMP_NO)
        cirNm.push(ele.EMP_NM)
      })
    }).finally(() =>{
      rowData.CIR_LIST_ID = cirId.toString()
      rowData.CIR_LIST_NM = cirNm.toString()
      mNGEB0010Popup.value.openPopup(rowData)
    })
  }
}

//초기 데이터셋팅
onMounted(() => {
  vm.$nextTick(() => {
    initCombo()
    onButtonsClick({ id :'btnSearch' })
  })  
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
        :button-list="['btnSearch', 'btnNew']"
        @click-button="onButtonsClick"
      />
    </v-card-title>
    <!-- content-area 해당 클래스의 이름은 필수 입니다. 
          다른 클래스의 이름으로 작업을 하고싶다면 content-area 클래스를 유지한채 다른 클래스를 붙여 사용해주세요.-->
    <v-card-text class="pa-3 pt-0 content-area">
      <!-- {  d-flex flex-column fill-height  } 클래스는 필수입니다. -->
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">  
          <i-input
            :label="$t('법령명')"
            v-model="paramList.LAW_NM"
            width="350px"
          />
          <i-select
            width="350px"
            :label="$t('진행상태')"
            v-model="paramList.STATUS"
            :items="codeList.statusList"
            item-value="COD"
            item-title="TXT"
          />
        </v-sheet>
        <!-- height : 직접 지정하고싶은 높이를 설정합니다.
                      만약 높이를지정하지 않으면 각 컨텐츠의 크기만큼 영역을 가집니다. -->
        <v-sheet height="90%" class="mb-2">
          <IGridTitle :title="$t('법령 제•개정 내역')"/>
            <RealGrid
              ref="grdMain"
              class="mt-2"
              style="height: 700px;"
              :grid-view-option="grdMainProps.gridViewOption"
              :keys="grdMainProps.keys" 
              :fields="grdMainProps.fields"
              :columns="grdMainProps.columns"
              :column-layout="grdMainProps.columnLayout"
              @onCellDblClicked="onCellDblClicked"
            />
        </v-sheet>
      </div>
    </v-card-text>    
    <!-- 제개정 팝업 -->
    <MNGEB0010Popup
      ref="mNGEB0010Popup"
      @saved="onMNGEB0010PopupSaved"
    />
  </v-card>
</template>

