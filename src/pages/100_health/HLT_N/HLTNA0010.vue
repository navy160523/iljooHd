<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from '@hiway/stores/logs'
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import { getCodeList } from '@hiway/api/commonApi'
import IMenuTitle from '@/components/IMenuTitle.vue'
import HLTNA0010Tab from '@/pages/100_health/HLT_N/HLTNA0010Tab.vue'

defineOptions({
  name: '100_health-HLT_N-HLTNA0010',
})

const vm = getCurrentInstance().proxy //다이얼로그관련
const t = useI18n().t
const menuTitle = ref(null)
const userLogStore = useLogsStore()
const userStore = useUserStore()
const tab = ref(null)
const tabList = ref([])

const getSystemCode = () => {
  Promise.all([
    getCodeList('HHII830A'),
  ]).then(res => {
    tabList.value = res[0].ORESULT_CUR
    tab.value = tabList.value[0].COD
  })
}

onMounted(() => {
  getSystemCode()
})
</script>

<template>
  <v-card class="pa-0 fill-height">
    <v-card-title class="pa-3 pb-0">
      <IMenuTitle
        ref="menuTitle"
        :title="$t(useLogsStore().menuId)"
      >
      </IMenuTitle>
    </v-card-title>
    <v-card-text class="pa-3 pt-0 content-area">
      <div class="d-flex flex-column fill-height">
        <v-sheet class="mb-2">
          <v-tabs v-model="tab">
            <v-tab v-for="item in tabList" :key="`tab_${item.COD}`" :value="item.COD">
              {{ item.TXT }}
            </v-tab>
          </v-tabs>
        </v-sheet>
        <v-window v-model="tab" class="h-window">
          <v-window-item v-for="item in tabList" :key="`tabcontent_${item.COD}`" :value="item.COD" eager>
            <HLTNA0010Tab :positionDiv="item.COD" />
          </v-window-item>
        </v-window>
      </div> 
    </v-card-text>
  </v-card>
</template>

<style scoped lang="scss">
.content-area {
  position: relative;
  height: calc(100vh - 180px);
  overflow-y: auto;
  > div {
    min-height: 700px;
  }
}

::v-deep(.rg-grid) {
  .rg-data-row {
    td:last-child {
      border-right: 1px solid #DFE3EF !important;
    }
  }

  .rg-header-cell:last-child {
    border-right: 1px solid #DFE3EF !important;
  }
}
</style>