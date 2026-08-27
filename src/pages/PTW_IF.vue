<!--
  화면명 : PTW I/F용 화면
  화면개요 : PTW 정보를 볼 수 있는 화면
-->
<script setup>
import { ref, reactive, getCurrentInstance, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonSearchnoAuthApi, commonExecuteApi, getCodeList, commonRequest } from '@hiway/api/commonApi'
import { useUserStore } from '@hiway/stores/user'
import RealGrid from '@/components/RealGrid.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import IUploadPopup from '@/pages/30_safety/SAF_J/IUploadPopup.vue'
import SAFBA0010PopUp1_new from "@/pages/30_safety/SAF_B/SAFBA0010PopUp1_new.vue"
import SAFBA0010PopUp1_shrt from "@/pages/30_safety/SAF_B/SAFBA0010PopUp1_shrt.vue"

const grdMain = ref(null)
const t = useI18n().t //다국어
const userStore = useUserStore()
const sCMPNY_DIV = ref('');
const sRCV_NO = ref('');
const safba00101_n = ref(null)
const safba00101_s = ref(null)


// mount 시 실행
onMounted(() => {
  console.log('onMounted userStore.url >> ', userStore.url)

  let urlParams = userStore.url.split('&')

  console.log('urlParams', urlParams)

  urlParams.forEach(async val => {  
    val = val.split('=')  
    if(val[0] === 'CMPNY_DIV'){  
      //console.log(val[0] + ' val >> ', val[1])
      sCMPNY_DIV.value = val[1]
    }
    if(val[0] === 'RCV_NO'){  
      //console.log(val[0] + ' val >> ', val[1])
      sRCV_NO.value = val[1]
    }   
  })
  if (sRCV_NO.value && sCMPNY_DIV.value){
    searchrcv()
  }

})

const searchrcv = () => {

  if (sRCV_NO.value.includes('-OS-')){
    // 단기공사
    safba00101_s.value.openPopup(sCMPNY_DIV.value, sRCV_NO.value, true)
  }
  else{
    //일반공사
    safba00101_n.value.openPopup(sCMPNY_DIV.value, sRCV_NO.value, true)
  }


}




</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <div class="d-flex align-center mb-2" style="min-height: 30px">
        <div class="title-bar">
          <span class="menuTitle"> PTW 조회 </span> 
        </div>
        <v-btn @click="searchrcv()"> 조회하기 </v-btn>
      </div>
    </v-card-title>
    <v-card-text>
      <div><strong> 회사명 </strong> : {{ sCMPNY_DIV }}</div>
      <div><strong> 허가서번호 </strong> : {{ sRCV_NO }}</div>


    </v-card-text>
  </v-card>
  <SAFBA0010PopUp1_new ref="safba00101_n" @upData="upData" />
  <SAFBA0010PopUp1_shrt ref="safba00101_s" @upData="upData" />
</template>

<style scoped lang="scss">


</style>

