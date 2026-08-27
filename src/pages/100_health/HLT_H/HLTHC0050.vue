<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import HLTHC0050Tab01 from './HLTHC0050Tab01.vue'
import HLTHC0050Tab02 from './HLTHC0050Tab02.vue'


defineOptions({
  name: '100_health-HLT_H-HLTHC0050',
})

const tab = ref('tab01')
const userStore = useUserStore()

onMounted(() => {})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle ref="menuTitle" :title="`${$t(useLogsStore().menuId)}`" />
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet>
          <v-tabs v-model="tab"
            ><v-tab value="tab01">지급 명단</v-tab>
            <v-tab value="tab02">팩킹리스트</v-tab>
          </v-tabs>
          <v-window v-model="tab" class="h-window">
            <v-window-item value="tab01">
              <HLTHC0050Tab01></HLTHC0050Tab01>
            </v-window-item>
            <v-window-item value="tab02">
              <HLTHC0050Tab02></HLTHC0050Tab02>
            </v-window-item>
            
          </v-window>
        </v-sheet>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  // 만약 타이틀 영역에 컴포넌트를 추가한다면
  // calc(100vh - (180px + 컨텐츠영역 px)) 을 더해주세요.
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    // content-area 내부 컨텐츠의 최소 높이를 지정합니다.
    // 지정하지 않을 경우 h-auto 클래스가 지정된 컨텐츠는 브라우저의 높이가 줄어들수록 0px까지 줄어듭니다.
    min-height: 700px;
  }
}
</style>
