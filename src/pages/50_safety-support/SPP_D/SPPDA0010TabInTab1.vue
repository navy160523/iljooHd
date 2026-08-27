<!-- SPPDA0010Tab1위험기계기구 안전검사 기본정보 탭-->
<!-- SI2팀 김성근 2024-04-03  -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import { useUserStore } from '@hiway/stores/user'
import A from '@/pages/50_safety-support/SPP_D/SPPDA0010TabInTab1A.vue'
import B from '@/pages/50_safety-support/SPP_D/SPPDA0010TabInTab1B.vue'
import C from '@/pages/50_safety-support/SPP_D/SPPDA0010TabInTab1C.vue'
import D from '@/pages/50_safety-support/SPP_D/SPPDA0010TabInTab1D.vue'
import E from '@/pages/50_safety-support/SPP_D/SPPDA0010TabInTab1E.vue'
import G from '@/pages/50_safety-support/SPP_D/SPPDA0010TabInTab1G.vue'
import AY from '@/pages/50_safety-support/SPP_D/SPPDA0010TabInTab1AY.vue'
import I from '@/pages/50_safety-support/SPP_D/SPPDA0010TabInTab1I.vue'
import J from '@/pages/50_safety-support/SPP_D/SPPDA0010TabInTab1J.vue'
import K from '@/pages/50_safety-support/SPP_D/SPPDA0010TabInTab1K.vue'
import L from '@/pages/50_safety-support/SPP_D/SPPDA0010TabInTab1L.vue'

const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const emit = defineEmits(["saveFlagFalse"])
const grdMain = ref(null)
const inputData = reactive({})
const props = defineProps({
  tab:{
    type:String,
    default:''
  },
  clickData: {
    type: Object,
    required: false,
    default() {
      return {};
    },
  },
  SaveFlag: {
    type: Boolean
  },
  codeList: {
    type: Object
  }
});

//그리드1 속성셋팅

// watch(()=>props.SaveFlag,(newValue)=>{
//   if(newValue){
//     emit('saveFlagFalse',DataEmit())
//   }
// })

const saveData =(e)=>{
  emit('saveFlagFalse',e)
}



</script>

<template>
  <v-card class="pa-0 fill-height"> 
    <!-- 크레인 -->
    <v-sheet  class="popUp-input-Form " style="height: auto;"  v-if="props.tab === 'two'" >
      <A  @saveData="saveData($event)" :SaveFlag="props.SaveFlag" :clickData="props.clickData" :codeList="props.codeList"/>
    </v-sheet>
    <!-- 압력용기 -->
    <v-sheet  class="popUp-input-Form Bheight"   v-else-if="props.tab === 'three'"  >
      <B  @saveData="saveData($event)" :SaveFlag='props.SaveFlag' :clickData="props.clickData" :codeList="props.codeList"/>
    </v-sheet>
    <!-- 리프트 -->
    <v-sheet  class="popUp-input-Form Aheight"   v-else-if="props.tab === 'four'"  >
      <C  @saveData="saveData($event)" :SaveFlag='props.SaveFlag' :clickData="props.clickData" :codeList="props.codeList"/>
    </v-sheet>
    <!-- 프레스 -->
      <v-sheet  class="popUp-input-Form Aheight"   v-else-if="props.tab === 'five'"  >
        <D  @saveData="saveData($event)" :SaveFlag='props.SaveFlag' :clickData="props.clickData" :codeList="props.codeList"/>
      </v-sheet>
    <!-- 전단기 -->
      <v-sheet  class="popUp-input-Form Aheight"   v-else-if="props.tab === 'six'"  >
        <E  @saveData="saveData($event)" :SaveFlag='props.SaveFlag' :clickData="props.clickData" :codeList="props.codeList"/>
      </v-sheet>
    <!-- 곤돌라 -->
    <v-sheet  class="popUp-input-Form Aheight"   v-else-if="props.tab === 'seven'"  >
        <G  @saveData="saveData($event)" :SaveFlag='props.SaveFlag' :clickData="props.clickData" :codeList="props.codeList"/>
      </v-sheet>
    <!-- 항만 크레인 -->
    <v-sheet  class="popUp-input-Form Aheight"   v-else-if="props.tab === 'eight'"  >
        <AY  @saveData="saveData($event)" :SaveFlag='props.SaveFlag' :clickData="props.clickData" :codeList="props.codeList"/>
      </v-sheet>
    <!-- 컨베이어 -->
    <v-sheet  class="popUp-input-Form Bheight"   v-else-if="props.tab === 'nine'"  >
        <I  @saveData="saveData($event)" :SaveFlag='props.SaveFlag' :clickData="props.clickData" :codeList="props.codeList"/>
      </v-sheet>
    <!-- 산업용 로봇 -->
    <v-sheet  class="popUp-input-Form Bheight"   v-else-if="props.tab === 'ten'"  >
        <J  @saveData="saveData($event)" :SaveFlag='props.SaveFlag' :clickData="props.clickData" :codeList="props.codeList"/>
      </v-sheet>
    <!-- 이동식 카크레인 -->
    <v-sheet  class="popUp-input-Form Aheight"   v-else-if="props.tab === 'eleven'"  >
        <K  @saveData="saveData($event)" :SaveFlag='props.SaveFlag' :clickData="props.clickData" :codeList="props.codeList"/>
      </v-sheet>
    <!-- 환기 설비 -->
    <v-sheet  class="popUp-input-Form Aheight"   v-else-if="props.tab === 'thirteen'"  >
        <L  @saveData="saveData($event)" :SaveFlag='props.SaveFlag' :clickData="props.clickData" :codeList="props.codeList"/>
    </v-sheet>
  </v-card>
</template>
<style lang="scss" scoped>
.Aheight {
  position: relative;
  height: auto;
}

.Bheight {
  position: relative;
  height: auto;
}

</style>