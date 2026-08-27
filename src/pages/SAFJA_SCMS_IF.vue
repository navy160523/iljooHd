<!--
  화면명 : SCMS I/F용 화면
  화면개요 : SCMS에서 호출용 화면
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonSearchnoAuthApi, commonExecuteApi, getCodeList, commonRequest } from '@hiway/api/commonApi'
import { useUserStore } from '@hiway/stores/user'
import RealGrid from '@/components/RealGrid.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import IUploadPopup from '@/pages/30_safety/SAF_J/IUploadPopup.vue'

const grdMain = ref(null)
const t = useI18n().t //다국어
const userStore = useUserStore()
const sCMPNY_DIV = ref('');
const sBIZ_REG_NO = ref('');
const sVEND_CD = ref('');
const sWORK_NO = ref('');
const sREV_NO = ref('');
//업로드 파일 보기
const fileUploadPopup = ref(null)

const page1 = reactive(
  {
    VND_NAME: '',
    VEND_FILE_ID: '',
    WORK_DESC: '',
    DTL_WORK_DESC: '',
    FILE_SECURITY: '',
    FILE_SECURITY_NAME: '',
    FILE_SAFETY: '',
    FILE_SAFETY_NAME: '',
    FILE_INSURANCE: '',
    FILE_INSURANCE_NAME: '',
    FILE_CONTRACT: '',
    FILE_CONTRACT_NAME: '',
    FILE_SIGN: '',
    FILE_SIGN_NAME: '',
    FILE_VEHICLES: '',
    FILE_VEHICLES_NAME: '',
    FILE_ETC: '',
    FILE_ETC_NAME: '',
  }
)

//그리드 속성셋팅 
const grd1Props = reactive({ 
  gridViewOption : { checkBar: { visible: false }, edit: { editable: false }, header: { height: 32 }},
  keys : [], 
  fields : [ 
    { fieldName: 'NAME', width: '100', editable: false, dataType: 'text', 
      header: { text: t('성명'), styleName: 'temp-header' },      
    },
    { fieldName: 'BIR_DAY', width: '100', editable: false, dataType: 'text', 
      header: { text: t('생년월일'), styleName: 'temp-header' },      
    },
    { fieldName: 'SEX', width: '50', editable: false, dataType: 'text', 
      header: { text: t('성별'), styleName: 'temp-header' },      
    },
    { fieldName: 'INOUT_GBN', width: '100', editable: false, dataType: 'text', 
      header: { text: t('외국인여부'), styleName: 'temp-header' },      
    },
    { fieldName: 'FILE_EMPCERT_YN', width: '100', editable: false, dataType: 'text', 
      header: { text: t('재직증명서'), styleName: 'temp-header' },
      renderer: {
          type: "html",
          callback: function (grid, cell, w, h) {
            var cellVal = cell.value
            if(cellVal === null){
              cellVal = ''
            }
            var str = 
            `<div style="display: flex; justify-content: space-between;">
              <p style="display: flex; align-items: center; justify-content: center; width: -webkit-fill-available; overflow-x: hidden;">
                ${cellVal}
              </p>
              <button id="cellButton" style="height: 30px;">
                <span class="mdi mdi-magnify text-light-blue-darken-1"
                style="font-size: 22px ;display: flex; align-items: center;"/>
              </button>
            </div>`
            return str;
          },
        }      
    },
    { fieldName: 'FILE_IDPHOTO_YN', width: '100', editable: false, dataType: 'text', 
      header: { text: t('증명사진'), styleName: 'temp-header' },
      renderer: {
          type: "html",
          callback: function (grid, cell, w, h) {
            var cellVal = cell.value
            if(cellVal === null){
              cellVal = ''
            }
            var str = 
            `<div style="display: flex; justify-content: space-between;">
              <p style="display: flex; align-items: center; justify-content: center; width: -webkit-fill-available; overflow-x: hidden;">
                ${cellVal}
              </p>
              <button id="cellButton2" style="height: 30px;">
                <span class="mdi mdi-magnify text-light-blue-darken-1"
                style="font-size: 22px ;display: flex; align-items: center;"/>
              </button>
            </div>`
            return str;
          },
        }      
    },
   
    // 안보이는거
    { fieldName: 'FILE_EMPCERT', dataType: 'text', header: { text: t('FILE_EMPCERT') },visible: false, },
    { fieldName: 'FILE_IDPHOTO', dataType: 'text', header: { text: t('FILE_IDPHOTO') },visible: false, },    
  ],
  columns : [],
}) 
grd1Props.columns = grd1Props.fields

// mount 시 실행
onMounted(() => {
  console.log('onMounted userStore.url >> ', userStore.url)

  let urlParams = userStore.url.split('&')

  //console.log('urlParams', urlParams)

  urlParams.forEach(async val => {  
    val = val.split('=')  
    if(val[0] === 'CMPNY_DIV'){  
      //console.log(val[0] + ' val >> ', val[1])
      sCMPNY_DIV.value = val[1]
    }
    if(val[0] === 'BIZ_REG_NO'){  
      //console.log(val[0] + ' val >> ', val[1])
      sBIZ_REG_NO.value = val[1]
    }
    if(val[0] === 'VEND_CD'){  
      //console.log(val[0] + ' val >> ', val[1])
      sVEND_CD.value = val[1]
    }
    if(val[0] === 'WORK_NO'){  
      //console.log(val[0] + ' val >> ', val[1])
      sWORK_NO.value = val[1]
    }
    if(val[0] === 'REV_NO'){  
      //console.log(val[0] + ' val >> ', val[1])
      sREV_NO.value = val[1]
    }   
  })

  if(sCMPNY_DIV.value && sBIZ_REG_NO.value && sVEND_CD.value && sWORK_NO.value && sREV_NO.value) {
    commonSearchnoAuthApi({
        queryId: "OUTBA0020_SEARCH_05",
        param: {
          CMPNY_DIV: sCMPNY_DIV.value,
          BIZ_REG_NO: sBIZ_REG_NO.value,
          VEND_CD: sVEND_CD.value,
          WORK_NO: sWORK_NO.value,
          REV_NO: sREV_NO.value,
        },
      }).then(res => { 
        if (res.ORESULT_CUR.length > 0) {
          page1.VND_NAME = res.ORESULT_CUR[0].VND_NAME
          page1.WORK_DESC = res.ORESULT_CUR[0].WORK_DESC
          page1.DTL_WORK_DESC = res.ORESULT_CUR[0].DTL_WORK_DESC
          page1.FILE_SECURITY = res.ORESULT_CUR[0].FILE_SECURITY
          page1.FILE_SECURITY_NAME = res.ORESULT_CUR[0].FILE_SECURITY_NAME
          page1.FILE_SAFETY = res.ORESULT_CUR[0].FILE_SAFETY
          page1.FILE_SAFETY_NAME = res.ORESULT_CUR[0].FILE_SAFETY_NAME
          page1.FILE_INSURANCE = res.ORESULT_CUR[0].FILE_INSURANCE
          page1.FILE_INSURANCE_NAME = res.ORESULT_CUR[0].FILE_INSURANCE_NAME
          page1.FILE_CONTRACT = res.ORESULT_CUR[0].FILE_CONTRACT
          page1.FILE_CONTRACT_NAME = res.ORESULT_CUR[0].FILE_CONTRACT_NAME
          page1.FILE_SIGN = res.ORESULT_CUR[0].FILE_SIGN
          page1.FILE_SIGN_NAME = res.ORESULT_CUR[0].FILE_SIGN_NAME
          page1.FILE_VEHICLES = res.ORESULT_CUR[0].FILE_VEHICLES
          page1.FILE_VEHICLES_NAME = res.ORESULT_CUR[0].FILE_VEHICLES_NAME
          page1.FILE_ETC = res.ORESULT_CUR[0].FILE_ETC
          page1.FILE_ETC_NAME = res.ORESULT_CUR[0].FILE_ETC_NAME
          page1.VEND_FILE_ID = res.ORESULT_CUR[0].VEND_FILE_ID
        }
      })
  }
  
  // 조회
  commonSearchnoAuthApi({ queryId: 'SAFJA0040_SEARCH_04', 
        param: {
          CMPNY_DIV: sCMPNY_DIV.value,
          BIZ_REG_NO: sBIZ_REG_NO.value,
          VEND_CD: sVEND_CD.value,
          WORK_NO: sWORK_NO.value,
          REV_NO: sREV_NO.value,
        }, }).then(res => {
    grdMain.value.getDataProvider().setRows(res.ORESULT_CUR)
  })
})

const openFile = val => {
  //console.log('val', val)
  let file_id = page1[val]  

  //console.log('file_id', file_id)

  if(file_id){     
    fileUploadPopup.value.openPopup2(file_id,'')
  }
}

const openFileGrid = (grid, clickInfo, column) => {

  //console.log('openFileGrid', column)

  let row = grdMain.value.getRowData(clickInfo.itemIndex)
  let file_id = ''

  if (clickInfo.fieldName === 'FILE_EMPCERT_YN') {
    file_id = row.FILE_EMPCERT    
  } else if (clickInfo.fieldName === 'FILE_IDPHOTO_YN') {
    file_id = row.FILE_IDPHOTO
  }

  //console.log('file_id', file_id)

  if(file_id){     
    fileUploadPopup.value.openPopup2(file_id,'')
  }

}

</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <div class="d-flex justify-space-between align-center mb-2" style="min-height: 30px">
        <div class="title-bar">
          <span class="menuTitle"> 단기공사 첨부파일 조회 </span>
        </div>
      </div>
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
          <v-sheet class="searchArea flex-column">
            <IGridTitle title="공사정보" />
            <v-row no-gutters class="align-center pB-10">
              <v-col>
                <div class="mt-2 d-flex justify-space-between">
                  <div class="d-flex">
                    <i-input
                      label-width="100px"
                      :label="$t('협력회사명')"                      
                      v-model="page1.VND_NAME"
                      readonly
                    />
                    <v-btn class="ml-1" @click="openFile('VEND_FILE_ID')" 
                      :class="'check'" 
                      height="35" elevation="0" color="btnSecondary">{{ t('사업자등록증') }}
                    </v-btn>
                  </div>
                </div>
              </v-col>
            </v-row>
            <v-row no-gutters class="align-center pB-10">
              <v-col>               
                <i-input
                  label-width="100px"
                  :label="$t('공사명')"                  
                  v-model="page1.WORK_DESC"
                  width="100%"
                  readonly
                />
              </v-col>
            </v-row>
            <v-row no-gutters class="align-center pB-10">
              <v-col>               
                <i-textarea
                  label-width="100px"                  
                  :label="$t('공사세부내역')"                  
                  v-model="page1.DTL_WORK_DESC"
                  width="100%"
                  :row="3"
                  :readonly="true"
                />
              </v-col>
            </v-row>
            <v-row no-gutters class="align-center pB-10">
              <v-col>               
                <i-input
                  label-width="100px"
                  :label="$t('보안서약서')"                  
                  v-model="page1.FILE_SECURITY_NAME"
                  width="100%"
                  readonly
                >
                  <template v-slot:append-inner>
                    <v-icon
                      @click="openFile('FILE_SECURITY')"
                      icon="mdi-magnify"                      
                    />
                  </template>
                </i-input>
              </v-col>
              <v-col class="ml-2">               
                <i-input                  
                  label-width="100px"
                  :label="$t('안전작업이행각서')"                  
                  v-model="page1.FILE_SAFETY_NAME"
                  width="100%"
                  readonly
                >
                  <template v-slot:append-inner>
                    <v-icon
                      @click="openFile('FILE_SAFETY')"
                      icon="mdi-magnify"                      
                    />
                  </template>
                </i-input>
              </v-col>
            </v-row>
            <v-row no-gutters class="align-center pB-10">
              <v-col>               
                <i-input
                  label-width="100px"
                  :label="$t('자필서명명단')"                  
                  v-model="page1.FILE_SIGN_NAME"
                  width="100%"
                  readonly
                >
                  <template v-slot:append-inner>
                    <v-icon
                      @click="openFile('FILE_SIGN')"
                      icon="mdi-magnify"                      
                    />
                  </template>
                </i-input>
              </v-col>
              <v-col class="ml-2">               
                <i-input
                  label-width="100px"
                  :label="$t('보험증권')"                  
                  v-model="page1.FILE_INSURANCE_NAME"
                  width="100%"
                  readonly
                >
                  <template v-slot:append-inner>
                    <v-icon
                      @click="openFile('FILE_INSURANCE')"
                      icon="mdi-magnify"                      
                    />
                  </template>
                </i-input>
              </v-col>              
            </v-row>
            <v-row no-gutters class="align-center pB-10">
              <v-col>               
                <i-input                  
                  label-width="100px"
                  :label="$t('공사도급계약서')"                  
                  v-model="page1.FILE_CONTRACT_NAME"
                  width="100%"
                  readonly
                >
                  <template v-slot:append-inner>
                    <v-icon
                      @click="openFile('FILE_CONTRACT')"
                      icon="mdi-magnify"                      
                    />
                  </template>
                </i-input>
              </v-col>
              <v-col class="ml-2">               
                <i-input                  
                  label-width="100px"
                  :label="$t('차량출입서류')"                  
                  v-model="page1.FILE_VEHICLES_NAME"
                  width="100%"
                  readonly
                >
                  <template v-slot:append-inner>
                    <v-icon
                      @click="openFile('FILE_VEHICLES')"
                      icon="mdi-magnify"                      
                    />
                  </template>
                </i-input>
              </v-col>
            </v-row>
            <v-row no-gutters class="align-center pB-10">
              <v-col>               
                <i-input
                  label-width="100px"
                  :label="$t('기타서류')"                  
                  v-model="page1.FILE_ETC_NAME"
                  width="100%"
                  readonly
                >
                  <template v-slot:append-inner>
                    <v-icon
                      @click="openFile('FILE_ETC')"
                      icon="mdi-magnify"                      
                    />
                  </template>
                </i-input>
              </v-col>
              <v-col class="ml-2">               
                
              </v-col>
            </v-row>
          </v-sheet>
      </div>
    
    </v-card-text>
    <v-sheet class="h-auto">
      <v-card-title class="pa-3 pb-0">
        <div class="d-flex justify-space-between align-center mb-2" style="min-height: 30px">
          <div class="title-bar">
            <span class="menuTitle"> 출입대상인원 </span>
          </div>
        </div>
      </v-card-title>
      <v-card-text class="pa-3 pt-0 content-area">
        <RealGrid
          ref="grdMain"
          style="width: 100%; height: 250px;"
          :grid-view-option="grd1Props.gridViewOption"
          :keys="grd1Props.keys" 
          :fields="grd1Props.fields"
          :columns="grd1Props.columns"
          @onCellItemClicked="openFileGrid"
        />
      </v-card-text>
    </v-sheet>
  </v-card>
  <IUploadPopup
    :isVisibled="false"
    ref="fileUploadPopup"
    :button-list="['btnClose']"
    @uploaded="uploaded"
    :autoUpload="true"
  />  
</template>

<style scoped lang="scss">
</style>
<route lang="yaml">
meta:
  noAuth: true
  layout: blank
  redirectIfLoggedIn: true
</route>
