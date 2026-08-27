<template>
  <v-footer class="footer" color="footerBg">
    <v-row no-gutters class="defaultContent">
      <v-col cols="10">
        <!-- <v-col class="footerText01 pa-0 text-white">
          울산광역시 동구 방어진순환도로 1000 대표전화 : 052.202.2114
        </v-col>
        <v-col class="footerText01 pa-0 text-white">
          Copyright © HD Hyundai. All Rights Reserved.
        </v-col> -->
        <v-col class="footerText02 pa-0 mt-4 btnContainer">
          <v-btn color="white" variant="plain" class="px-0 mx-2 ml-0" @click="popup()" >개인정보처리방침</v-btn>
          <!-- <v-divider thickness="1" vertical class="divider"></v-divider>
          <v-btn color="white" variant="plain" class="px-0 mx-2">이메일무단수집거부</v-btn> -->
          
          <!-- <v-divider thickness="1" vertical class="divider"></v-divider>
          <v-btn color="white" variant="plain" class="px-0 mx-2">영상정보처리기기 운영 · 관리방침</v-btn>
          <v-divider thickness="1" vertical class="divider"></v-divider>
          <v-btn color="white" variant="plain" class="px-0 ml-2">신규 협력회사 등록</v-btn> -->
        </v-col>
      </v-col>
      <v-col cols="2 pL-23">
        <!-- <v-select
          :menu-props="{
            contentClass: 'footerSelect',
            attach: true
          }"
          placeholder="Family Site"
          variant="underlined"
          :items="['현대중공업', 'HiSEs 통합관리 시스템']"></v-select> -->
      </v-col>
    </v-row>
  </v-footer>
  <PersonalProcessingPolicy ref="personalProcessingPolicy" />
</template>

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'

const emit = defineEmits(['click'])

const popup = () => {
  emit('click')
}
</script>
