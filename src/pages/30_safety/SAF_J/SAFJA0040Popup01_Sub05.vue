<!--
  화면명 : 공사 신청 서브 화면5
  화면개요 : 공사 신청 서브 화면 위험작업허가서 작성
-->

<script setup>
import { ref, onMounted } from 'vue'
import { GridView, LocalDataProvider } from 'realgrid'
// import popup03 from '@/pages/90_outsourcing/OUT_B/OUTBA0020Popup03.vue'
// import popup04 from '@/pages/90_outsourcing/OUT_B/OUTBA0020Popup04.vue'
// import popup05 from '@/pages/90_outsourcing/OUT_B/OUTBA0020Popup05.vue'
import { commonSearchApi } from '@/@hiway/api/commonApi'
// import { timeFormat } from "@/utils/common"
import { useI18n } from 'vue-i18n'

import { useUserStore } from "@hiway/stores/user";

onMounted(() => {
  // popData()
  comboListData()
  //위험작업구분 대분류
  comboWorkList1()
  //위험작업구분 소분류
  comboWorkList3()
})


const userStore = useUserStore();

// const tf = timeFormat

const emit = defineEmits(['close'])

const vm = getCurrentInstance().proxy

const BA0030POP = ref('')
const BA0050POP = ref('')
const BA0020POP04 = ref('')

const chkIndex = ref('')


const { t } = useI18n()

const picPop = () => {
  
}

const popData = (data) => {
  console.log('data ', data)
  commonSearchApi({
    queryId: "OUTBA0020_SEARCH_13",
    param: {
      CMPNY_DIV: data.CMPNY_DIV,
      BIZ_REG_NO: data.BIZ_REG_NO,
      WORK_NO: data.WORK_NO,
      VEND_CD: data.VEND_CD,
      REV_NO: data.REV_NO,
      RCV_NO: '',
      SHORT_WORK_CMPNY: data.CMPNY_DIV,
    },
    }).then(async res => {
      console.log('OUTBA0020_SEARCH_13 :: ', res)
      if (res.ORESULT_CUR1.length > 0) {
        // page5.SEARCH_DATA = res.ORESULT_CUR1
        page5.SHORT_WORK_NO = res.ORESULT_CUR1[0].SHORT_WORK_NO
        page5.SHORT_WORK_DT = res.ORESULT_CUR1[0].SHORT_WORK_DT
        page5.SYS_DATE = res.ORESULT_CUR1[0].SYS_DATE
        page5.WORKER_CNT = res.ORESULT_CUR1[0].WORKER_CNT 
        page5.CMPNY_DIV = res.ORESULT_CUR1[0].CMPNY_DIV
        page5.DEPT_NAME = res.ORESULT_CUR1[0].DEPT_NAME
        page5.RESP_EMP_NM = res.ORESULT_CUR1[0].RESP_EMP_NM
        page5.RESP_HP_NO = res.ORESULT_CUR1[0].RESP_HP_NO
        controlData.value.SEARCH_DATA = res.ORESULT_CUR1

        for (let i = 0; i < res.ORESULT_CUR1.length; i++){
          await comboWorkList2(i)
        }
        
        
        
        item1.value = page5.CMPNY_DIV
        await comboList2()
        item2.value = res.ORESULT_CUR1[0].BSNS_CD

        
      }
      console.log('controlData.value ::  ', controlData.value)
  })
}

// //단기공사 정보 저장
// //페이지 입력값
const page5 = reactive(
  {
    CMPNY_DIV: '',
    BSNS_CD: '',
    SHORT_WORK_NO: '',    //단기공사번호
    SHORT_WORK_DT: '',    //단기공사기간
    SYS_DATE: '',         //작성일시
    WORKER_CNT: '',       //작업인원
    DEPT_NAME: '',        //작업인원
    RESP_EMP_NM: '',      //작업책임자명
    RESP_HP_NO: '',       //작업책임자 연락처

    MASK: '##:##',
  }
)

let controlData = ref({
  SEARCH_DATA: [
    {
    BIZ_REG_NO: userStore.bizRegNo,
  RCV_NO: '',
  CHK: '',
  WORKDT: '',
  WORKSTDT: '',
  WORKENDT: '',
  DN_DIV: 'D',
  WORKSTTM: '08:00',
  WORKENTM: '16:59',
  WORKTYPENM: '',
  DANG_DIV: '',
  WRK_DIST_SEQ: '',
  CF_DIV: '',
  WRK_PLC: '10',  //단기공사
  JOB_PLC: '',
  LOCCD: '',
  WORK_DETAIL: '',
  DNGR_RSN: '',
  // CF_DIV: '',
  HEIGHT: '',
  PRESSURE: '',
  PIPE_DIA: '',
  HEIGHT_YN: 'N',
  PRESSURE_YN: 'N',
  PIPE_DIA_YN: 'N',
  CONFINED_YN: 'N',
  ARGN_YN: 'N',
  ELEC_YN: 'N',
  JOB_LPLC: '',
  JOB_MPLC: '',
  JOB_SPLC: '',
  WORKER_CNT: 0,
  OVERTIME_YN: 'N',
  SUBLIST: [],
  SEARCH_DATA: []
}]})

const comboData = reactive({
  itemList1: [],
  itemList2: [],
  // item1: '',
  // item2: '',
})
const item1 = ref('')
const item2 = ref('')

const comboListData = () => {
  // Z000
  commonSearchApi({
    queryId: "OUTBA0020_SEARCH_01",
    param: {
      CMPNY_DIV: 'HHI',
      ALL_UP_CD: 'HHIZ000',
      USE_FLAG: 'Y',
      CODE_NAME_TYPE: '0',
      PAGE_GBN: 'false',
      PAGE_NUM: '',
      PAGE_IDX: '',
    },
    }).then(res => {

      if (res.ORESULT_CUR.length > 0) {
        comboData.itemList1 = res.ORESULT_CUR
        
      //   page5.SHORT_WORK_NO = res.ORESULT_CUR1[0].SHORT_WORK_NO
      //   page5.SHORT_WORK_DT = res.ORESULT_CUR1[0].SHORT_WORK_DT
      //   page5.SYS_DATE = res.ORESULT_CUR1[0].SYS_DATE
      //   page5.WORKER_CNT = res.ORESULT_CUR1[0].WORKER_CNT 
      }
  })
}

const comboList2 = () => {
  // Z000
  commonSearchApi({
    queryId: "OUTBA0020_SEARCH_14",
    param: {
      CMPNY_DIV: item1.value,
      PAGE_GBN: 'false',
      PAGE_NUM: '',
      PAGE_IDX: '',
    },
    }).then(res => {
      console.log('comboListData :: ', res)
      if (res.ORESULT_CUR.length > 0) {
        comboData.itemList2 = res.ORESULT_CUR
        // item2.value = ''

      }
  })
  
}

//팝업 리턴 데이터
//작업 장소
const popReturnVal = (e) => {
  controlData.value.SEARCH_DATA[e.LORINDEX].LOCCD = e.COD
  controlData.value.SEARCH_DATA[e.LORINDEX].JOB_PLC = e.TXT

  controlData.value.SEARCH_DATA[e.LORINDEX].JOB_LPLC = e.LTYPE
  controlData.value.SEARCH_DATA[e.LORINDEX].JOB_MPLC = e.MTYPE
  controlData.value.SEARCH_DATA[e.LORINDEX].JOB_SPLC = e.COD  

  console.log('return Data :::: ', e)
  // controlData.value = e
  // controlData.value. = ''
  // controlData.value. = ''
   
}

//단기공사 팝업 리턴 데이터
const popReturnVal2 = (e) => {

  // console.log('popReturnVal2 :::: ', e)
}

//장소 팝업 호출
const locationPop = (arrIndex) => {
  BA0020POP04.value.openPopup(arrIndex);
  // chkIndex.value = arrIndex
}

//단기공사 번호 호출 팝업
const shortWorkNo = () => {
  BA0050POP.value.openPopup()
}

const btnList = ref([
  {
    id: 'create',
    text: '작업상세 추가',
    type: 'light'
  },
  {
    id: 'delete',
    text: '작업상세 삭제',
    type: 'light'
  },
])

const btnClickEvt = (e) => {

  if (e.id === 'create') {
    controlData.value.SEARCH_DATA.push({
      BIZ_REG_NO: userStore.bizRegNo,
      CHK: '',
      WORKDT: '',
      WORKSTDT: '',
      WORKENDT: '',
      DN_DIV: 'D',
      WORKSTTM: '08:00',
      WORKENTM: '16:59',
      WORKTYPENM: '',
      DANG_DIV: '',
      WRK_DIST_SEQ: '',
      CF_DIV: '',
      JOB_PLC: '',
      LOCCD: '',
      WORK_DETAIL: '',
      DNGR_RSN: '',
      // CF_DIV: '',
      HEIGHT: '',
      PRESSURE: '',
      PIPE_DIA: '',
      HEIGHT_YN: 'N',
      PRESSURE_YN: 'N',
      PIPE_DIA_YN: 'N',
      CONFINED_YN: 'N',
      ARGN_YN: 'N',
      ELEC_YN: 'N',
      JOB_LPLC: '',
      JOB_MPLC: '',
      JOB_SPLC: '',
      WORKER_CNT: 0,
      OVERTIME_YN: 'N',
      SUBLIST: [],
      // SEARCH_DATA: []
    })
  } else if (e.id === 'delete') {

    vm.$swal({ title: t("xbuilder.msg.question-delete"), showCancelButton: true }).then(res => {
      if (res.isConfirmed) {
        
        for (let i = controlData.value.SEARCH_DATA.length - 1; i > -1; i--) {
          if (controlData.value.SEARCH_DATA.length === 1) {
            vm.$swal({ title: t("상세 정보를 더이상 삭제 할수없습니다.") })
            return;
          }
          if (controlData.value.SEARCH_DATA[i].CHK) {
            controlData.value.SEARCH_DATA.splice(i ,1)
          }
        }
      }
    })
  }
}

const radioChange = (e,index) => {
  
  console.log('e ::: ', e, ' , ', e.target._value)
  if (e.target._value === 'N') {
    controlData.value.SEARCH_DATA[index].WORKSTTM = '20:00'
    controlData.value.SEARCH_DATA[index].WORKENTM = '04:59'
    // inputData.stTm = '20:00'
    // inputData.enTm = '04:59'
    
  } else if (e.target._value === 'D') {
    controlData.value.SEARCH_DATA[index].WORKSTTM = '08:00'
    controlData.value.SEARCH_DATA[index].WORKENTM = '16:59'
    // inputData.stTm = '08:00'
    // inputData.enTm = '16:59'
  }
}

const changeTxt = (value,index) => {
  
  controlData.value.SEARCH_DATA[index].WORKSTTM = value.replace(/[^0-9:]/g, '')
}

const requiredTime = (value) => {
  const mobileRegex = /^(\d{2}):(\d{2})$/

  mobileRegex.test(value)
  console.log('value ', value)
  if (value !== null) {
    console.log('value ', value)

  }

  return value

}

const setData = (e) => {
  popData(e)
  item1.value = page5.CMPNY_DIV
}

//입력데이터 부모로 전달.
const getData = () => {

  let resultData = ''
  resultData = controlData.value.SEARCH_DATA

  return resultData
}

const dangerJob = reactive({
  list1: [],
  list2: [],
  list3: [],
  item1: '',
  item2: '',
  item3: '',
})


const comboWorkList1 = () => {
    //대분류
    commonSearchApi({
    queryId: "OUTBA0020_SEARCH_01",
    param: {
      CMPNY_DIV: 'HHI',
      ALL_UP_CD: 'HHIE120',
      USE_FLAG: 'Y',
      CODE_NAME_TYPE: '0',
      PAGE_GBN: 'false',
      PAGE_NUM: '',
      PAGE_IDX: '',
    },
    }).then(res => { 
      if (res.ORESULT_CUR.length > 0) {
        dangerJob.list1 = res.ORESULT_CUR
        dangerJob.list1.unshift({TXT: '' , COD: ''})
        dangerJob.item1 = res.ORESULT_CUR[0].COD  
      } else {
        dangerJob.list1 = [{ TXT: '', COD: '' }]
        dangerJob.item1 = ''
      }
  })
}
//중분류
const comboWorkList2 = (arrIndex) => {
  console.log('dangerJob.item1 ', dangerJob.item1 , ' arrIndex :: ', arrIndex)
  //중분류
  commonSearchApi({
      queryId: "OUTBA0020_SEARCH_11",
      param: {
        WRK_PLC: '10',
        DANG_DIV: controlData.value.SEARCH_DATA[arrIndex].DANG_DIV,
      },
  }).then(res => {
      
    if (res.ORESULT_CUR.length > 0) {
      controlData.value.SEARCH_DATA[arrIndex].SUBLIST = res.ORESULT_CUR
      controlData.value.SEARCH_DATA[arrIndex].SUBLIST.unshift({WRK_DIST: '' , SEQ: ''})
      // controlData.value.SEARCH_DATA[arrIndex].WRK_DIST_SEQ = res.ORESULT_CUR[0].SEQ
    } else {
      controlData.value.SEARCH_DATA[arrIndex].SUBLIST = [{ WRK_DIST: '', SEQ: '' }]
      controlData.value.SEARCH_DATA[arrIndex].WRK_DIST_SEQ = ''
      
    }
    dangerJob.item3 = ''
      
  })
}
//소분류
const comboWorkList3 = () => {
    commonSearchApi({
    queryId: "OUTBA0020_SEARCH_01",
    param: {
      CMPNY_DIV: 'HHI',
      ALL_UP_CD: 'HHIE160',
      USE_FLAG: 'Y',
      CODE_NAME_TYPE: '0',
      PAGE_GBN: 'false',
      PAGE_NUM: '',
      PAGE_IDX: '',
    },
  }).then(res => {
      console.log('res ',)
    if (res.ORESULT_CUR.length > 0) {
      dangerJob.list3 = res.ORESULT_CUR
    }
      
  })
}

const comboChange = (arrIndex) => {
  const filterVal = controlData.value.SEARCH_DATA[arrIndex].SUBLIST.filter(data => data["SEQ"] === controlData.value.SEARCH_DATA[arrIndex].WRK_DIST_SEQ)

  if (filterVal.length > 0) {
    controlData.value.SEARCH_DATA[arrIndex].CF_DIV =  filterVal[0].CF_DIV
  } else {
    controlData.value.SEARCH_DATA[arrIndex].CF_DIV = ''
  }

}

defineExpose({ getData,setData })
</script>

<template>
  <div class="fill-height">

    <i-card :title="t('공사정보')" min-width="1200">
      <v-col class="mR-5 pa-5 bg-base">
        <v-row no-gutters class="align-center pB-10">
          <i-input v-model="page5.SHORT_WORK_NO" :label="t('단기공사번호')" width="350px" labelWidth="110px" readonly></i-input>
          <!-- <v-btn icon="mdi-check" @click="shortWorkNo"></v-btn> -->
          <!--<i-input v-model="page5.SYS_DATE" class="pl-4" :label="t('작성일시')" width="350px" labelWidth="110px" readonly></i-input>-->
          <i-input v-model="page5.SHORT_WORK_DT" :label="t('단기공사기간')" width="350px" labelWidth="110px" readonly></i-input>  
          <i-input v-model="page5.WORKER_CNT" :label="t('작업인원')"  width="150px" labelWidth="60px" class="pl-3" readonly ></i-input>
          <span class="pl-2 d-flex align-center">{{ t('명') }}</span>
        </v-row>
        <v-row no-gutters class="">
          <i-input v-model="page5.RESP_EMP_NM" :label="t('작업책임자(정)')" width="330px" labelWidth="110px" readonly></i-input>
          <v-btn icon="mdi-check" @click="picPop"></v-btn>
          <i-input v-model="page5.RESP_HP_NO" label=""  width="173px" labelWidth="0px" class="pl-3" readonly></i-input>
        </v-row>        
      </v-col>
    </i-card>

    <i-card :title="t('작업정보')" min-width="1200">
      <v-col class="mR-5 pa-5 bg-base">

        <v-row no-gutters class="pB-10">          
          <i-select 
            :items="comboData.itemList1" 
            v-model="item1"
            readonly
            @update:model-value="comboList2()" 
            item-value="COD" 
            item-title="TXT"
            class="pr-2" 
            :label="t('작업사업부')" 
            width="340px" 
            labelWidth="110px"
            required
          ></i-select>
          <!--<svg-icon class="datepickerDot" name="redDot"></svg-icon>-->
          <i-select 
            :items="comboData.itemList2" 
            v-model="item2" 
            readonly
            item-value="BSNS_CD" 
            item-title="BSNS_NM" 
            title="" 
            width="200px" 
            labelWidth="0px"
          ></i-select>
        </v-row>
        <v-row no-gutters class="pB-10">
          <i-input v-model="page5.DEPT_NAME" :label="t('담당조직')" width="545px" labelWidth="110px" readonly></i-input>
          
        </v-row>       
        
      </v-col>
    </i-card>

    <!--작업정보 일시 설정 -->
    <i-card class="pb-5" :title="t('작업정보 상세')" :caption="t('작업정보 상세 SUB')" @btnClick="btnClickEvt"  :btnList="btnList">
      <div>
        <v-col cols="12 pb-3" v-for="(item,index) in controlData.SEARCH_DATA" :key="index" >
          <v-row class="pt-1 pb-1 pr-2">
            <v-col cols="2" class="pa-0 pl-5">
              <v-checkbox :label="t('삭제 구분')" v-model="item.CHK" style='max-height: 40 !important;'/>
            </v-col>
          </v-row>
          <v-row no-gutters class="pb-4">
            <v-col cols="5" class="pa-0 pl-5">
              <div class="d-flex pb-2">
                <i-input 
                  class="mr-3"
                  :label="t('작업기간')"
                  labelWidth="80px"
                  width="230px"
                  type="date"
                  v-model="item.WORKSTDT"
                  readonly
                />
                <i-input 
                  class="mr-2"
                  label="~"
                  labelWidth="10px"
                  width="170px"
                  type="date"
                  v-model="item.WORKENDT"
                  readonly
                />                
              </div>
              <div class="pb-5 d-flex align-center"> 
                <span class="mr-3 formLabelText">{{ t('작업시간') }}</span>
                <v-radio-group
                  inline
                  v-model="item.DN_DIV"
                  readonly
                  class="formLabel align-center pr-0 mr-0"
                  @change="radioChange($event,index)" >
                  <v-radio color="primary" :label="t('주간')" :value="'D'" class="mr-5"></v-radio>
                  <v-radio color="primary" :label="t('야간')" :value="'N'"></v-radio>
                </v-radio-group>
                <i-input 
                  class="mr-2"
                  @input="changeTxt(item.WORKSTTM,index)" 
                  v-model="item.WORKSTTM" 
                  readonly
                  width="130px" 
                  type="time" 
                  labelWidth="0px" 
                />
                <i-input 
                  class="" 
                  @input="changeTxt(item.WORKENTM,index)" 
                  v-model="item.WORKENTM" 
                  readonly
                  label="~" 
                  width="140px" 
                  type="time" 
                  labelWidth="10px" 
                />
                <span class="d-flex align-center" style="inline-size: 50px;"></span>
              </div>
              <!-- <i-input class="pb-2" v-model="item.WORKDT" title="작업기간" width="300px" titleWidth="80px" /> -->
              <div class="pb-2 d-flex align-center"> 
                <span class="mr-3 formLabelText">{{ t('밀폐구역여부') }}</span>
                <v-radio-group
                  inline
                  v-model="item.CONFINED_YN"
                  readonly
                  class="formLabel align-center pr-1">
                  <v-radio color="primary" label="예" :value="'Y'" class="mr-5"></v-radio>
                  <v-radio color="primary" label="아니오" :value="'N'"> </v-radio>
                </v-radio-group>
                <i-select 
                  class="mr-1" 
                  item-value="COD" 
                  item-title="TXT" 
                  v-model="item.HEIGHT_YN" 
                  readonly
                  :items="[{COD: 'Y',TXT: '해당'},{COD: 'N',TXT: '미해당'}]"
                  :label="t('고소높이')" 
                  width="180px" 
                  labelWidth="70px"
                ></i-select>
                <i-input 
                  class="mr-1" 
                  v-model="item.HEIGHT"
                  readonly
                  width="80px" 
                  labelWidth="0px" 
                ></i-input>
                <span class="formDetailText d-flex align-center">{{ t('미터') }}</span>
              </div>
              <div class="pb-2 d-flex align-center"> 
                <span class="mr-3 formLabelText">{{ t('아르곤이용작업') }}</span>
                <v-radio-group
                  inline
                  v-model="item.ARGN_YN"
                  readonly
                  class="formLabel align-center pr-1">
                  <v-radio color="primary" label="예" :value="'Y'" class="mr-5"></v-radio>
                  <v-radio color="primary" label="아니오" :value="'N'"> </v-radio>
                </v-radio-group>
                <i-select 
                  class="mr-1" 
                  item-value="COD" 
                  item-title="TXT" 
                  v-model="item.PRESSURE_YN" 
                  readonly
                  :items="[{COD: 'Y',TXT: '해당'},{COD: 'N',TXT: '미해당'}]"
                  :label="t('테스트압력')" 
                  width="180px" 
                  labelWidth="70px"
                ></i-select>
                <i-input 
                  class="mr-1" 
                  v-model="item.PRESSURE" 
                  readonly
                  width="80px" 
                  labelWidth="0px" 
                ></i-input>
                <span class="formDetailText d-flex align-center">{{ t('Bar/Kg') }}</span>
              </div>
              <div class="d-flex align-center"> 
                <span class="mr-3 formLabelText">{{ t('수전구역여부') }}</span>
                <v-radio-group
                  inline
                  v-model="item.ELEC_YN"
                  readonly
                  class="formLabel align-center pr-1">
                  <v-radio color="primary" label="예" :value="'Y'" class="mr-5"></v-radio>
                  <v-radio color="primary" label="아니오" :value="'N'"> </v-radio>
                </v-radio-group>
                <i-select 
                  class="mr-1" 
                  item-value="COD" 
                  item-title="TXT" 
                  v-model="item.PIPE_DIA_YN" 
                  readonly
                  :items="[{COD: 'Y',TXT: '해당'},{COD: 'N',TXT: '미해당'}]"
                  :label="t('PIPE직경')" 
                  width="180px" 
                  labelWidth="70px"
                ></i-select>
                <i-input 
                  class="mr-1" 
                  v-model="item.PIPE_DIA"
                  readonly
                  width="80px" 
                  labelWidth="0px"
                ></i-input>
                <span class="formDetailText d-flex align-center">{{ t('인치') }}</span>
              </div>
            </v-col>
            <v-col cols="7" class="pa-0 pl-5"> 
              <v-row no-gutters class="pb-5">
                <v-col>                  
                  <div class="d-flex pb-2 align-center">
                    <i-input class="mr-1" v-model="item.JOB_PLC" :label="t('작업장소')" width="350px" labelWidth="87px" readonly/>
                    <v-btn @click="locationPop(index)" color="primary">{{ t('설정') }}</v-btn>
                    <i-input 
                      class="pl-4 mr-1" 
                      v-model="item.WORKER_CNT"
                      readonly 
                      :label="t('작업인원')" 
                      width="130px" 
                      labelWidth="60px"
                    />
                    <span class="d-flex align-center">{{ t('명') }}</span>
                  </div>
                  <!-- dangerJob -->
                  <div class="d-flex pb-2"> 
                    <i-select 
                      v-model="item.DANG_DIV"
                      readonly
                      :items="dangerJob.list1"
                      item-value="COD" 
                      item-title="TXT"
                      class="mr-1"
                      :label="t('작업구분')" width="230px" labelWidth="87px"
                      @update:model-value="comboWorkList2(index)">
                    </i-select>
                    <i-select 
                      v-model="item.WRK_DIST_SEQ"
                      readonly
                      :items="item.SUBLIST"
                      item-value="SEQ" item-title="WRK_DIST"
                      class="mr-1"
                      label="" width="55%" labelWidth="0px"
                      @update:model-value="comboChange(index)">
                    </i-select>
                    <i-select 
                      v-model="item.CF_DIV"
                      readonly
                      :items="dangerJob.list3"
                      item-value="COD" item-title="TXT"
                      class="pr-3" 
                      label="" width="100px" labelWidth="0px">
                    </i-select>
                  </div>
                  <div class="d-flex pb-2">
                    <span class="formLabelText d-flex pt-2">{{ t('작업상세내용') }}</span>
                    <v-textarea
                      color="textLabel"
                      class="textAreaColHeight"
                      readonly
                      no-resize
                      rows="3"
                      variant="outlined"
                      base-color="inputreadonlyd"
                      bg-color="#fff" 
                      v-model="item.WORK_DETAIL"
                      />
                  </div>
                  <div class="d-flex">
                    <span class="formLabelText d-flex pt-2">{{ t('유해위험요소') }}</span>
                    <v-textarea
                      color="textLabel" 
                      class="textAreaColHeight"
                      readonly
                      no-resize
                      rows="2"
                      variant="outlined"
                      base-color="inputreadonlyd"
                      bg-color="#fff"
                      v-model="item.DNGR_RSN"
                      />
                  </div>
                </v-col>                

              </v-row>

            </v-col>
          </v-row>

          <v-divider
            class="mx-5 divider"
            thickness="1px"/>
        </v-col>
      </div>
    </i-card>


  </div>
  <!-- <popup03 @returnData="popReturnVal"  ref="BA0030POP" ></popup03> -->
  <!-- <popup05 @returnData2="popReturnVal2"  ref="BA0050POP" ></popup05>
  <popup04 @returnData="popReturnVal" ref="BA0020POP04" ></popup04> -->
</template>



<style scoped lang="scss">
.formLabelText {
  inline-size: 95px;
}

.textAreaColHeight {
  // block-size: 50px;
}

.formDetailText {
  font-size: 14px;
  font-weight: 400;
  inline-size: 50px;
}

</style>

<route lang="yaml">
  meta:
    noAuth: true
  </route>
