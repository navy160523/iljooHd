<!-- 
  * Vue 내 용 : 협력사 안전관리 자체평가/결과
  * 작 성 자 : 일주지앤에스 차동운
  * 최초 작성일 : 2024/04/02
  * 최종 수정자 : 일주지앤에스 차동운
  * 최종 수정일 : 2024/04/02 
-->

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import TAB01 from "@/pages/30_safety/SAF_I/TAB/SAFIB0030_TAB01.vue"
import TAB02 from "@/pages/30_safety/SAF_I/TAB/SAFIB0030_TAB02.vue"

defineOptions({
  name:'30_safety-SAF_I-SAFIB0030',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const userStore = useUserStore() //유저정보
const menuTitle = ref(null)

const tab = ref('TAB_01')
const TAB_01 = ref(null) 
const TAB_02 = ref(null) 
const tabShow = ref(false)

const searchParams = reactive({
  CMPNY_DIV: 'HHI',
})

const checkGroup = () => {

  return commonSearchApi(
    { 
        queryId : 'SAFIH0010_SEARCH_01'
      , param: searchParams 
    }).then((res)=>{
      //const aa = res.ORESULT_CUR.EMP_NO
      res.ORESULT_CUR.forEach( value => {
        if(value.EMP_NO === userStore.userId){
          tabShow.value = true
        }

        if(userStore.authGrpCd.includes('GRP00369') || userStore.authGrpCd.includes("HIWAYGRP00001")){
          tabShow.value = true
        }
      })
  })
}

onMounted(() => {
  checkGroup()
})
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
        <v-sheet class="pb-1">
          <v-tabs v-model="tab">
            <v-tab value="TAB_01">
              자체평가
            </v-tab>
            <v-tab value="TAB_02" v-show="tabShow">
              평가결과
            </v-tab>
          </v-tabs>
        </v-sheet>
        <v-window 
          v-model="tab" 
          class="h-window"
        >
          <v-window-item value="TAB_01">
            <TAB01 ref="TAB_01" />
          </v-window-item>
          <v-window-item value="TAB_02"> 
            <TAB02 ref="TAB_02" />
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
</style>
  
