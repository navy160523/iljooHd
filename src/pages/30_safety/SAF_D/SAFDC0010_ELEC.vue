<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import RealGrid from '@/components/RealGrid.vue'
import IUpload from '@/components/IUpload.vue'
import { lowerCase } from 'lodash-es'
import SAFDC0010_01 from './SAFDC0010_01_ELEC.vue'
import SAFDC0010_02 from './SAFDC0010_02_ELEC.vue'
import SAFDC0010_03 from './SAFDC0010_03_ELEC.vue'

defineOptions({
  name: '30_safety-SAF_D-SAFDC0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t //다국어
const menuTitle = ref(null)
const userStore = useUserStore()
const { sliSAFDC0010 } = history.state
const value = ref(
  sliSAFDC0010 === undefined ? 'A' : sliSAFDC0010.GUBUN
)
// const codeList = reactive({
//   VIO_GDIV: [
//     { TXT: '안전수칙위반', COD: 'A' },
//     { TXT: '시정통보', COD: 'B' },
//     { TXT: '작업중지', COD: 'C' },
//   ],
// })
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="`${$t(useLogsStore().menuId)}`"
      />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">      
      <div class="d-flex flex-column fill-height">
        <v-sheet class="searchArea d-flex mt-1">
          <v-radio-group v-model="value" inline>
            <v-radio label="안전수칙위반" value="A"></v-radio>
            <v-radio label="시정통보" value="B"></v-radio>
            <v-radio label="작업중지" value="C"></v-radio>
          </v-radio-group>
        </v-sheet>
        <SAFDC0010_01 v-if="value === 'A'"></SAFDC0010_01>
        <SAFDC0010_02 v-else-if="value === 'B'"></SAFDC0010_02>
        <SAFDC0010_03 v-else-if="value === 'C'"></SAFDC0010_03>
      </div>
    </v-card-text>
  </v-card>
</template>
