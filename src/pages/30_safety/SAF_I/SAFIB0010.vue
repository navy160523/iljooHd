<!-- 
  * Vue 내 용 : SAFIB0010 협력사 안전관리 수준평가 등록/현황
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/04/01
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/06/01 
-->

<script setup>
import { ref, onMounted } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import TAB01 from "@/pages/30_safety/SAF_I/TAB/SAFIB0010_TAB01.vue"
import TAB02 from "@/pages/30_safety/SAF_I/TAB/SAFIB0010_TAB02.vue"
import TAB03 from "@/pages/30_safety/SAF_I/TAB/SAFIB0010_TAB03.vue"

defineOptions({
  name:'30_safety-SAF_I-SAFIB0010',
})

const t = useI18n().t //다국어
const userStore = useUserStore()
const codeList = reactive({})

const tabValue = ref('TAB_01')
const TAB_01 = ref(null) 
const TAB_02 = ref(null) 
const TAB_03 = ref(null) 
const isVisibleTab = ref(true)

//조회조건
const searchParams = reactive({
  CMPNY_DIV: userStore.cmpnyDiv,
  BSNS_CD: '',
  CHRG_GRP: '',
})

const dtBusiness = reactive([
  { COD: "", TXT: "전체" },
  { COD: "AC00", TXT: "조선사업부" },
  { COD: "AE00", TXT: "특수선사업부" },
  { COD: "AQ00", TXT: "해양에너지사업본부" },
  { COD: "AK00", TXT: "엔진기계사업부" },
])

const dtCharger = reactive([
  { COD: "A", TXT: "전체" },
  { COD: "S", TXT: "조선" },
  { COD: "G", TXT: "군산" },
])

onMounted(() => {
  initPage()
})

const initPage = () => {
  const param = {
    CMPNY_DIV: userStore.cmpnyDiv,
    BSNS_CD: userStore.bsnsCd,
    ASGN_CD: userStore.asgnCd,
    EMP_NO: userStore.userId,
  }

  console.log('initPage : ', param)
  Promise.all([ 
    commonSearchApi({ queryId : 'SAFIB0010_SEARCH_EMP', param }) , 
  ]).then(res => {
    if(res[0].ORESULT_CUR.length === 0) {
      searchParams.BSNS_CD = userStore.bsnsCd
    }
    else {
      res[0].ORESULT_CUR.forEach( value => {
        if(value.PS_GUBUN === 'PS00') { //총괄담당자
          codeList.BSNS_CD = dtBusiness
          searchParams.BSNS_CD = ''
        }
        else if(value.PS_GUBUN === 'PS10') {  //조선담당자

          codeList.BSNS_CD = dtBusiness.filter(
            x => x.COD === 'AC00',
          )
          codeList.CHRG_GRP = dtCharger.filter(
            x => x.COD === 'A' || x.COD === 'S',
          )

          searchParams.BSNS_CD = 'AC00'
          searchParams.CHRG_GRP = 'A'
        }
        else if(value.PS_GUBUN === 'PS20') {  //군산담당자

          codeList.BSNS_CD = dtBusiness.filter(
            x => x.COD === 'AC00',
          )

          codeList.CHRG_GRP = dtCharger.filter(
            x => x.COD === 'A' || x.COD === 'G',
          )
          searchParams.BSNS_CD = 'AC00'
          searchParams.CHRG_GRP = 'G'
        }
        else if(value.PS_GUBUN === 'PS30') {  //해양담당자

          codeList.BSNS_CD = dtBusiness.filter(
            x => x.COD === 'AQ00',
          )
          searchParams.BSNS_CD = 'AQ00'
        }
        else if(value.PS_GUBUN === 'PS40') {  //엔진기계담당자

          codeList.BSNS_CD = dtBusiness.filter(
            x => x.COD === 'AK00',
          )
          searchParams.BSNS_CD = 'AK00'
        }
        else if(value.PS_GUBUN === 'PS50') {  //특수선담당자

          codeList.BSNS_CD = dtBusiness.filter(
            x => x.COD === 'AE00',
          )
          searchParams.BSNS_CD = 'AE00'
        }
      })
    }
  })
}

// 전체일 경우 부문별 상세, 담당임원별 탭 보이도록
watch(
  () => searchParams.CHRG_GRP, newValue => {
    console.log('[SAFIB0010-watch] newValue = ', newValue)
    if(newValue === 'A') {
      isVisibleTab.value = true
    }
    else {
      isVisibleTab.value = false
    }
  },
)
</script>

<template>
  <v-card class="pa-3 fill-height">
    <v-card-title class="pa-2 py-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
      />
    </v-card-title>
    <v-card-text class="pa-2 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex">
          <i-select
            v-model="searchParams.BSNS_CD"
            :label="$t('사업부')"
            label-width="60px"
            append-inner-icon="mdi-magnify"
            :items="codeList.BSNS_CD"
            item-title="TXT"
            item-value="COD"
            width="250px"
          />
          <div>
            <v-radio-group
              v-model="searchParams.CHRG_GRP"
              inline
            >
              <v-radio 
                v-for="(item, i) in codeList.CHRG_GRP" 
                :key="i" 
                class="radio-box mx-2"
                :value="item.COD" 
                :label="item.TXT"
              />
            </v-radio-group>
          </div>
        </v-sheet>
        <v-sheet class="mb-2">
          <v-tabs 
            v-model="tabValue"
          >
            <v-tab
              value="TAB_01"
            >
              전체(순위)
            </v-tab>
            <v-tab
              v-if="isVisibleTab"
              value="TAB_02"
            >
              부문별 상세
            </v-tab>
            <v-tab 
              v-if="isVisibleTab"
              value="TAB_03"
            >
              담당임원별
            </v-tab>
          </v-tabs>
        </v-sheet>
        <v-window 
          v-model="tabValue" 
          class="h-window"
        >
          <v-window-item 
            value="TAB_01"
          >
            <TAB01 
              ref="TAB_01"
              :business01="searchParams.BSNS_CD"
              :charger="searchParams.CHRG_GRP"
            />
          </v-window-item>
          <v-window-item
            v-if="isVisibleTab"
            value="TAB_02"
          > 
            <TAB02 
              ref="TAB_02" 
              :business02="searchParams.BSNS_CD"
            />
          </v-window-item>
          <v-window-item
            v-if="isVisibleTab" 
            value="TAB_03"
          > 
            <TAB03 
              ref="TAB_03" 
              :business03="searchParams.BSNS_CD"
            />
          </v-window-item>
        </v-window>
      </div>
    </v-card-text>
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

.radio-box{
    width: 60px;
}
</style>