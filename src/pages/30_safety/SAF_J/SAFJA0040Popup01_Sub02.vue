<!--
  화면명 : 공사 신청 서브 화면2
  화면개요 : 공사 신청 서브 화면 공사정보 입력 화면
-->

<script setup>
import { ref, onMounted } from 'vue'
import { commonSearchApi } from '@/@hiway/api/commonApi'
//import popup02 from '@/pages/90_outsourcing/OUT_B/OUTBA0020Popup02.vue'
import IGridTitle from "@/components/IGridTitle.vue";
import { useI18n } from "vue-i18n";
import RealGrid from "@/components/RealGrid.vue";
// import { selectFile, setFileUpload, create_UUID } from "@/utils/fileTool"
import { useUserStore } from "@hiway/stores/user"
import IUploadPopup from "@/components/popup/IUploadPopup.vue"

const { t } = useI18n();

const emit = defineEmits(['close'])

const useUser = useUserStore()
const fileUploadPopup = ref(null)



onMounted(() => {
})


//콤보박스 value  값 받는 처리 부분.
const itemList1 = ref()
const item1 = ref()
const itemList2 = ref()
const item2 = ref()

//그리드세팅
const grdMain = ref(null)

//파일 정보 그리드에 전달용 변수
const getRowIndexVal = ref('')

//콤보박스 조회
const searchCombo = () => {
  //작업분류
  commonSearchApi({
    queryId: "OUTBA0020_SEARCH_15",
    param: {
      WORK_NO: page2.WORK_NO,
      REV_NO: page2.REV_NO,
      BIZ_REG_NO: page2.BIZ_REG_NO,
      CMPNY_DIV: page2.CMPNY_DIV,
    },
  }).then(res => { 
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
  

  //호선/공사
  commonSearchApi({
    queryId: 'OUTBA0020_SEARCH_08',
    param: {CMPNY_DIV:page2.CMPNY_DIV,JOB_BSNS_CD: ''}
  },true).then(res => { 

    itemList2.value = res.ORESULT_CUR
    itemList2.value.unshift({ WORK_NM: '선택', WORK_NO: '' })  
    item2.value = ''
  })

    //출입용도
    commonSearchApi({
      queryId: "OUTBA0020_SEARCH_01",
      param: {
      CMPNY_DIV: 'HHI',
      ALL_UP_CD: 'HHIE270',
      USE_FLAG: 'Y',
      CODE_NAME_TYPE: '0',
      PAGE_GBN: 'false',
      PAGE_NUM: '',
      PAGE_IDX: '',
    },
    }).then(res => { 

      itemList1.value = res.ORESULT_CUR
      itemList1.value.unshift({ TXT: '-선택하세요-', COD: '' })  
      item1.value = ''
    })

  const unitList = [
    {
      COD: 'Kg',
      TXT: 'Kg',
    },
    {
      COD: 'L',
      TXT: 'L',
    },
  ]

  grdMain.value.setBindingColumn('MSDS_UNIT', unitList, 'COD', 'TXT')
    
}

const page2 = reactive(
  {
    CMPNY_DIV: '',
    WORK_NO: '',
    REV_NO: '',
    WORK_AREA_NAME: '',     //공사장소
    HULL_NO: '',
    
    WORK_AREA_LCD: '',      //장소대분류
    WORK_AREA_MCD: '',      //장소중분류
    WORK_AREA_SCD: '',      //장소소분류
    WORK_AREA_DESC: '',     //공사장소상세
    DTL_WORK_DESC: '',      //세부공사내역
    HARM_CMCAL: '',         //유해화학물질
    HARM_CMCAL_QTY: '',     //유해화학물질사용량
    HARM_DPOINT: '',        //유해위험POINT
    ENTRANCE: '',           //출입용도
    USE_EQUIP: '',          //사용장비
    EQUIP_DRIVER: '',       //장비운전자
    RELE_LICENSE: '',        //관련자격
    BIZ_REG_NO: '',         //사업자등록번호

    MSDS: []        //MSDS 데이터

  }
)


//그리드 속성셋팅
const grdMainProps = reactive({
  gridViewOption : { header: { height: 30 }, stateBar: { visible: false }, checkBar: {  visible: true } },
  keys : ['COL1'],
  fields : [ 
    { fieldName: 'MSDS_NM', dataType: 'text', width: '150',
      header: {
        text: t('MSDS'),
      },
    },
    { fieldName: 'MSDS_FILE', dataType: 'text', editable:false,
      header: { text: t('파일첨부') }, width: '50',
      button: "action",
      buttonVisibility: "always"
    },
    { fieldName: 'MSDS_SEQ', dataType: 'text',
      header: { text: t('사용량') }, 
    },
    {
      fieldName: 'MSDS_UNIT', dataType: 'text', 
      lookupDisplay: true, editor: { type: 'list', dropDownWhenClick: true, textReadOnly: true }, 
      header: { text: t('유해화학물질 단위') }, 
    },
    //저장시 필수값 숨김처리
    { fieldName: 'CMPNY_DIV', dataType: 'text',visible: false },
    { fieldName: 'BIZ_REG_NO', dataType: 'text',visible: false },
    { fieldName: 'WORK_NO', dataType: 'text', visible: false },
    { fieldName: 'REV_NO', dataType: 'text', visible: false },
    { fieldName: 'INSERT_USER_NM', dataType: 'text',visible: false },
  ],
  columns : [],
  columnLayout: [],
})

grdMainProps.columns = grdMainProps.fields


//입력데이터 부모로 전달.
const getData = () => {
  page2.MSDS = grdMain.value.getDataProvider().getJsonRows(0, -1)
  let resultData = ''
  resultData = page2
  
  return resultData
}

//부모로 부터 받은 데이터 전달
const setData = (data) => {
  console.log('data ', data)
  page2.WORK_TYPE = data.WORK_TYPE
  page2.WORK_NO = data.WORK_NO
  page2.VEND_CD = data.VEND_CD
  page2.REV_NO = data.REV_NO
  page2.WORK_AREA_NAME = data.WORK_AREA_NAME
  page2.HULL_NO = data.HULL_NO
  page2.WORK_AREA_LCD = data.WORK_AREA_LCD
  page2.WORK_AREA_MCD = data.WORK_AREA_MCD
  page2.WORK_AREA_SCD = data.WORK_AREA_SCD
  page2.WORK_AREA_DESC = data.WORK_AREA_DESC
  page2.DTL_WORK_DESC = data.DTL_WORK_DESC
  page2.HARM_CMCAL = data.HARM_CMCAL
  page2.HARM_CMCAL_QTY = data.HARM_CMCAL_QTY
  page2.HARM_DPOINT = data.HARM_DPOINT
  page2.ENTRANCE = data.ENTRANCE
  page2.USE_EQUIP = data.USE_EQUIP
  page2.EQUIP_DRIVER = data.EQUIP_DRIVER
  page2.RELE_LICENSE = data.RELE_LICENSE
  page2.CMPNY_DIV = data.CMPNY_DIV
  page2.BIZ_REG_NO = data.BIZ_REG_NO

  searchCombo()

}

// 각종 팝업 처리
const popupOpen = (grid, clickInfo, column) => {  
  const row = grdMain.value.getRowData(clickInfo.itemIndex)

  console.log('row ', row )

  if (clickInfo.fieldName === 'MSDS_FILE') {
    getRowIndexVal.value = clickInfo.itemIndex
    fileUploadPopup.value.changeCmpny('VENDER')
    fileUploadPopup.value.openPopup(row.MSDS_FILE)
  }
  
}

//단기공사 S 건설공사 B
const popReturnVal = (e) => {
  // console.log('e ', e)
  page2.WORK_AREA_NAME = e.TXT
  page2.WORK_AREA_LCD = e.WORK_AREA_LCD
  page2.WORK_AREA_MCD = e.WORK_AREA_MCD
  page2.WORK_AREA_SCD = e.WORK_AREA_SCD
}

const onButtonsClick = (btn) => {
  if (page2.WORK_TYPE === '2') {
    return;
  }

  if (btn.id === 'btnCreate') {
    grdMain.value.getDataProvider().addRow({
        MSDS_NM: ""
      , MSDS_FILE: ""
      , MSDS_SEQ: ""
      , MSDS_UNIT: ""
      , CMPNY_DIV: useUser.cmpnyDiv
      , BIZ_REG_NO: useUser.bizRegNo
      , WORK_NO: page2.WORK_NO
      , REV_NO: page2.REV_NO
      , INSERT_USER_NM: useUser.bizRegNo
    })  
  }
}

//fileUpload - 사업자등록증사본
//파일업로드 기능 구현 메서드
//업로드 파일 팝업
//파일 읽어옴
const fileSelected = (e) => {
  let testFile = ''
  //testFile = selectFile(e ,false,20)
  //정상적으로 읽어오는지 테스트
  console.log('testFile ::: ' , testFile)
}

//파일 정보 제거
const clearFile = () => {
  //파일 저장 데이터 삭제.
  // files.value = null
  // uploadFiles.value = []
}

//전달받은 파일정보.
const uploaded = param => {
  grdMain.value.getDataProvider().setValue(getRowIndexVal.value, "MSDS_FILE",param.fileId)
  console.log('uploaded param', param)
}


defineExpose({ getData, setData })

</script>
<template>
  <div class="fill-height">
    <i-card :title="t('공사 정보')" min-width="1200">
      <v-col class="mR-5 pa-5 bg-base">
        <v-row no-gutters class="align-center pB-10">
          <i-input 
            class="mr-4" 
            v-model="page2.WORK_AREA_NAME" 
            :label="t('공사장소')" 
            width="350px" 
            labelWidth="102px" 
            readonly
            
          >
          </i-input>
          
          <i-input 
            class="ml-1" 
            v-model="page2.WORK_AREA_DESC"
            readonly
            :label="t('공사장소 상세')" 
            width="450px" 
            labelWidth="90px"
          ></i-input>
        </v-row>
        <v-row no-gutters class="pB-10">
          
          <v-col class="pa-0  d-flex">
            <span class="formLabelText d-flex pt-2">{{ t('공사내용') }}  </span>
            <v-textarea
              v-model="page2.DTL_WORK_DESC"
              readonly
              color="textLabel"
              class="textarea"
              no-resize
              variant="outlined"
              base-color="inputDisabled"
              bg-color="#fff" 
              />
          </v-col>
          
        </v-row>
        <v-row no-gutters class="pB-10" style="flex-direction: column;">
          <IGridTitle
            :use-permission="false"
            @click-button="onButtonsClick"
            :title="$t('유해화학물질')"
          ></IGridTitle>
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            style="height: 200px;"
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
            :column-layout="grdMainProps.columnLayout"
            @onCellButtonClicked="popupOpen"
          />          
        </v-row>
        <v-row no-gutters class="pB-10">
          <v-col class="pa-0 d-flex">
            <span class="formLabelText d-flex pt-2 end"> {{t('유해위험요인')}} </span>
            <v-textarea
              v-model="page2.HARM_DPOINT"
              readonly
              color="textLabel"
              class="textarea"
              no-resize
              variant="outlined"
              base-color="inputDisabled"
              bg-color="#fff" />
          </v-col>
        </v-row>
        <v-row no-gutters class="align-center">
          <i-select 
            item-value="COD"
            item-title="TXT"
            v-model="page2.ENTRANCE" 
            readonly
            :items="itemList1" 
            :label="t('출입용도')" 
            width="400px" labelWidth="102px"/>
        </v-row>
      </v-col>
    </i-card>

    <i-card title="사용장비" min-width="1200" class="pb-5">
      <v-col class="mR-5 pa-5 bg-base">
        <v-row no-gutters class="pB-10">
          <!-- <i-input v-model="page2.USE_EQUIP" :label="t('사용장비')" width="100%" labelWidth="110px" ></i-input> -->
          <span class="formLabelText d-flex pt-2 end"> {{t('사용장비')}} </span>
          <v-textarea
              v-model="page2.USE_EQUIP"
              readonly
              color="textLabel"
              class="textarea"
              no-resize
              variant="outlined"
              base-color="inputDisabled"
              bg-color="#fff" />
          
        </v-row>
        <v-row no-gutters class="pB-10">
          <!-- <i-input v-model="page2.EQUIP_DRIVER" :label="t('운전자')" width="337px" labelWidth="110px" ></i-input> -->
          <span class="formLabelText d-flex pt-2 end"> {{t('운전자')}} </span>
          <v-textarea
              v-model="page2.EQUIP_DRIVER"
              readonly
              color="textLabel"
              class="textarea pr-4"
              no-resize
              variant="outlined"
              base-color="inputDisabled"
              bg-color="#fff" />
          <!-- <i-input v-model="page2.RELE_LICENSE" :label="t('관련자격')"  width="865px" labelWidth="110px" class="pl-5" ></i-input> -->
          <span class="formLabelText d-flex pt-2 end"> {{t('관련자격')}} </span>
          <v-textarea
              v-model="page2.RELE_LICENSE"
              readonly
              color="textLabel"
              class="textarea"
              no-resize
              variant="outlined"
              base-color="inputDisabled"
              bg-color="#fff" />
        </v-row>
        
      </v-col>
    </i-card>
  </div>
  <!-- <popup02 @returnData="popReturnVal" ref="BA0020POP" ></popup02> -->

  <IUploadPopup
    :isVisibled="false"
    :buttonList="['btnClose']"
    ref="fileUploadPopup"
    @uploaded="uploaded"
    />
</template>


<style scoped lang="scss">
.formLabelText {
  inline-size: 110px;
}

.radioGroup {
  max-inline-size: 200px;
}

.leftCard {
  max-inline-size: 420px !important;
}

.textareaCol {
  max-inline-size: 515px;
  min-inline-size: 515px;

  &:has(.end) {
    max-inline-size: 535px;
    min-inline-size: 535px;
  }
}
</style>


<route lang="yaml">
  meta:
    noAuth: true
  </route>