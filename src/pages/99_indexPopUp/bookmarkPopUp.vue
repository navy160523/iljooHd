<script setup>
import { ref, reactive, onMounted } from 'vue'


import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'

import queryFlowHelper from '@/utils/searchFlowHelper'

import { useI18n } from 'vue-i18n'

import _ from 'lodash'

const emit = defineEmits(['selected'])


const searchArea = ref(null)
const t = useI18n().t //다국어
const dialog = ref(false)
const delDiv= ref(null)

const bookMark = reactive([
  {title:'교육훈련',icons:'mdi-close',isHover:false},
  {title:'안전포상',icons:'mdi-close',isHover:false},
  {title:'기초정보 관리',icons:'mdi-close',isHover:false},
  {title:'장비자격',icons:'mdi-close',isHover:false},
  {title:'수시 위험성평가',icons:'mdi-close',isHover:false},
  {title:'보건지표',icons:'mdi-close',isHover:false},
  {title:'교통안전',icons:'mdi-close',isHover:false},
  {title:'안전문화 수준진단',icons:'mdi-close',isHover:false},
  {title:'공통코드관리',icons:'mdi-close',isHover:false},
  {title:'권한관리',icons:'mdi-close',isHover:false},
  {title:'대시보드',icons:'mdi-close',isHover:false},
])

const LastAccessed = reactive([
  {title:'안전칭찬쿠폰',icons:'mdi-chevron-right',isHover:false},
  {title:'교육계획/ 신청 및 실적',icons:'mdi-chevron-right',isHover:false},
  {title:'자율안전인증',icons:'mdi-chevron-right',isHover:false},
  {title:'무재해 일수집계 (본부안전용)',icons:'mdi-chevron-right',isHover:false},
  {title:'인증심사관리',icons:'mdi-chevron-right',isHover:false},
  {title:'무재해포상',icons:'mdi-chevron-right',isHover:false},
  {title:'안전성과 우수포상',icons:'mdi-chevron-right',isHover:false},
  {title:'부수 화학물질관리',icons:'mdi-chevron-right',isHover:false},
  {title:'화학물질관리시스템',icons:'mdi-chevron-right',isHover:false},
  {title:'기초정보관리',icons:'mdi-chevron-right',isHover:false},
  {title:'공통코드관리',icons:'mdi-chevron-right',isHover:false},
  {title:'권한관리',icons:'mdi-chevron-right',isHover:false},
])

const openPopup = ()=> {  
    dialog.value = true
}
  
 


const onClose = () => {
  dialog.value = false
}


const isHover = (i,item) => {
if(item == 'Del'){
  bookMark[i].isHover = true
}
else{
  LastAccessed[i].isHover =true
}

}

const isUnHover =( i,item )=>{
  if(item == 'Del'){
  bookMark[i].isHover = false
  }
  else{
    LastAccessed[i].isHover =false
  }
}

const isDel = i =>{
  delDiv.value[i].style.display ='none'
  bookMark[i] = {}
}

const isGo = i =>{
  console.log(i)
}

defineExpose({
  openPopup,
})



</script>

<template style="margin:0px;">
  <VDialog 
    v-model="dialog" 
    eager
    persistent 
    width="660px"
    height="639px"
    class="draggable-dialog" 
    scrollable
  >    
    <div class="title-bar"  style="cursor: auto; background-color:#fff; color:#222; font-size:20px; font-weight: 700; display: flex; justify-content: space-between;">
      <p style="display:inline-block">즐겨찾기 목록</p>
      <v-icon @click="onClose" style="margin-right:15px">mdi-close</v-icon>
    </div>
    <VContainer  style="background-color: white; padding:30px; ">
      <VRow>
        <v-col cols="6" class="noneScroll">
          <div  class="bookMarkBtn" ref="delDiv" @mouseenter="isHover(i,'Del')" @mouseleave="isUnHover(i,'Del')"  v-for="(item,i) in bookMark" :key="i">
          <p>{{ item.title }}</p>
          <div style="display: flex; align-items: center;">
          <p v-if="item.isHover" style="color:#ff1d00; font-size: 12px; font-style: normal; font-weight: 600; margin-right:7px !important;">삭제</p>
          <v-icon @click="isDel(i)" :style="['cursor:pointer',{'color': !item.isHover ? '' : '#FF1D00'}]">{{ item.icons }}</v-icon>
          </div>
        </div>
      </v-col>

      <v-col cols="6" class="noneScroll" style="border-left: 1px solid #E6E6E6; padding : 4px 30px; ">
        <p style="color: #000;font-size: 15px;font-weight: 600;">최근접속한 메뉴</p>
        <hr style="width: 100%; height:1px; border: none; background: #E6E6E6;">
        <div class="LastAccessed"  @mouseenter="isHover(i,'LastAccessed')" @mouseleave="isUnHover(i,'LastAccessed')" v-for="item,i in LastAccessed" :key="i" >
          <p>{{ item.title }}</p>
          <v-icon  @click="isGo(i)" v-if="item.isHover">{{ item.icons }}</v-icon>
        </div>
      </v-col>


      </VRow>
    </VContainer>
  </VDialog>
</template>

