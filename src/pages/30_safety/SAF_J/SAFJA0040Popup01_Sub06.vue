<!--
  화면명 : 공사 신청 서브 화면3
  화면개요 : 공사 신청 서브 화면 작업자 출입정보 입력화면
-->

<script setup>
import { ref, onMounted } from 'vue'
import { GridView, LocalDataProvider } from 'realgrid'
import { commonSearchApi } from '@/@hiway/api/commonApi'
import { useI18n } from 'vue-i18n'

const emit = defineEmits(['close'])

const { t } = useI18n()


onMounted(() => {
  
})

const controlData = reactive({
  SEARCH_DATA: []
})


//장소 팝업 호출
const locationPop = () => {

}

const popData = (data) => {
  console.log('data ', data)
  commonSearchApi({
    queryId: "OUTBA0020_SEARCH_16",
    param: {
      CMPNY_DIV: data.CMPNY_DIV,
      BIZ_REG_NO: data.BIZ_REG_NO,
      SHORT_WORK_NO: data.VEND_CD + '-' +data.WORK_NO +'-'+ data.REV_NO,
    },
    }).then(res => {
      console.log('OUTBA0020_SEARCH_16 :: ', res)
      if (res.ORESULT_CUR.length > 0) {
        controlData.SEARCH_DATA = res.ORESULT_CUR
        // page5.SEARCH_DATA = res.ORESULT_CUR1
        // page5.SHORT_WORK_NO = res.ORESULT_CUR1[0].SHORT_WORK_NO
        // page5.SHORT_WORK_DT = res.ORESULT_CUR1[0].SHORT_WORK_DT
        // page5.SYS_DATE = res.ORESULT_CUR1[0].SYS_DATE
        // page5.WORKER_CNT = res.ORESULT_CUR1[0].WORKER_CNT 
        // page5.CMPNY_DIV = res.ORESULT_CUR1[0].CMPNY_DIV
        // page5.DEPT_NAME = res.ORESULT_CUR1[0].DEPT_NAME
        // page5.RESP_EMP_NM = res.ORESULT_CUR1[0].RESP_EMP_NM
        // page5.RESP_HP_NO = res.ORESULT_CUR1[0].RESP_HP_NO
        // controlData.value.SEARCH_DATA = res.ORESULT_CUR1

        console.log('page5 res ::  ', res)

        // item1.value = page5.CMPNY_DIV
        // comboList2()
        // item2.value = res.ORESULT_CUR1[0].BSNS_CD
      }
  })
}


const setData = (e) => {
  popData(e)
  // item1.value = page5.CMPNY_DIV
}

//입력데이터 부모로 전달.
const getData = () => {

  let resultData = ''
  resultData = controlData.SEARCH_DATA

  return resultData
}

defineExpose({ setData,getData })
</script>

<template>
  <div class="fill-height">
    <div v-for="(item, index) in controlData.SEARCH_DATA" :key="index"> 
    
      <!-- <v-row no-gutters class="align-center" style="justify-content: center;">
        <span style="font-size: 19px; font-weight: bold;">{{ item.RCV_NO }}</span>
      </v-row> -->
      <i-card :title="t('작업계획서 상세')" min-width="1200">
        <v-col cols="12" class="mR-5 pa-5 bg-base">
          <v-row no-gutters class="align-center pb-2">
            <i-input :label="t('위험작업지시서 번호')" width="490px" labelWidth="120px"
                      v-model="item.RCV_NO" readonly/>
          </v-row>
          <v-row no-gutters class="align-center pb-2">
            <i-input :label="t('작업업체')" width="490px" labelWidth="120px"
                      v-model="item.VND_NAME" readonly/>
            <i-input :label="t('작업일자')" width="490px" labelWidth="120px"
                      v-model="item.WORK_DT" readonly/>
          </v-row>
          <v-row no-gutters class="align-center pb-2">
            <i-input :label="t('작업유형')" width="490px" labelWidth="120px"
                      v-model="item.WRK_DIST_NM" readonly/>
            <i-input :label="t('작업장소')" width="490px" labelWidth="120px"
                      v-model="item.JOB_SPLC_NM" readonly/>
          </v-row>
          <v-row no-gutters class="align-center pb-3">
            <i-input :label="t('작업내용')" width="1000px" labelWidth="120px"
                      v-model="item.WORK_DESC" readonly/>
          </v-row>
          <v-divider class="pb-3"/>
          <v-row no-gutters class="align-center pb-10">
            <i-input :label="t('중량물 유형')" width="320px" labelWidth="120px"
                      v-model="item.OVERWGT_TYPE" readonly/>
            <i-input :label="t('중량물 무게')" width="320px" labelWidth="120px"
                      v-model="item.OVERWGT_WGT" readonly/>
            <i-input :label="t('중장비 유형')" width="320px" labelWidth="120px"
                      v-model="item.HEAVY_EQUIP_TYPE" readonly/>
          </v-row>
          <v-row no-gutters class="pB-10">
            <div class="d-flex textareaCol mr-4">
              <i-textarea
                color="textLabel"
                class="textarea"
                :label="$t('주요 위험사항 대책')"
                no-resize
                variant="outlined"
                base-color="inputDisabled"
                bg-color="#fff" 
                v-model="item.DANG_DESC"
                readonly/>
            </div>
            <div class="d-flex textareaCol">
              <i-textarea
                color="textLabel"
                class="textarea"
                :label="$t('운행경로(차량계 하역운반/건설기계)')"
                no-resize
                variant="outlined"
                base-color="inputDisabled"
                bg-color="#fff" 
                v-model="item.DRIVE_DESC"
                readonly/>
            </div>
          </v-row>
        </v-col>
      </i-card>

      <i-card class="pb-5" :title="t('작업자 명단')" min-width="1200">
        <v-col class="mR-5 pa-5 bg-base">

          <v-row no-gutters class="pB-10">
            <i-input v-model="item.RESP_EMP_NM" :label="t('작업지휘자(작업책임자)')" width="350px" labelWidth="150px" readonly/>
            <i-input v-model="item.RESP_HP_NO" :label="t('연락처')" width="350px" labelWidth="100px" readonly/>
            
          </v-row>
          <v-row no-gutters class="pB-10">
            <i-input v-model="item.RESP_EMP_NM2" :label="t('차선임자')" width="350px" labelWidth="150px" readonly/>
            <i-input v-model="item.RESP_HP_NO2" :label="t('연락처')"  width="350px" labelWidth="100px" readonly/>
          </v-row>
          
        </v-col>
      </i-card>
      <v-divider class="my-5"/>
    </div>
  </div>
</template>

<style scoped lang="scss">
.formLabelText {
  inline-size: 110px;
}

.textareaCol {
  max-inline-size: 500px;
  min-inline-size: 500px;

  &:has(.end) {
    max-inline-size: 500px;
    min-inline-size: 500px;
  }
}

.setHeight {
  block-size: 600px;
  overflow-y: scroll;
}
</style>

<route lang="yaml">
  meta:
    noAuth: true
  </route>