<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import IGridTitle from '@/components/IGridTitle.vue'
import { useI18n } from 'vue-i18n'
import { commonSearchApi } from '@hiway/api/commonApi'
import dayjs from 'dayjs'

const vm = getCurrentInstance().proxy
const t = useI18n().t
const dialog = ref(false)
const dashData = ref(null)
const yearList = ref([])

const searchParams = reactive({
  YEAR: '',
})

const openPopup = () => {
  dialog.value = true

  init()
}

const searchData = () => {
  commonSearchApi({ queryId: 'SRMAA0060_SEARCH_03', param: searchParams }).then(res => {
    dashData.value = res.ORESULT_CUR[0]
  })
}

const onButtonsClick = btn => {
  const btnId = btn.id

  if(btnId === 'btnClose') {
    dialog.value = false
  }
}

const init = () => {
  searchParams.YEAR = dayjs().format('YYYY')

  for(let i = 0; i <= 10; i++) {
    yearList.value.push({
      COD: searchParams.YEAR - i + '',
      TXT: searchParams.YEAR - i + '',
    })
  }

  searchData()
}

onMounted(() => {
  // console.log('yyyy', dayjs().format('YYYY'))
})

defineExpose({
  openPopup,
})
</script>

<template>
  <v-dialog
    v-model="dialog"
    eager
    persistent
    class="draggable-dialog"
    width="1000px"
  >
    <div class="title-bar">
      {{ $t('전사 안전 RISK 공모전') }}
    </div>
    <v-card class="pa-3 fill-height">
      <v-card-title class="pa-0 py-0">
        <IGridTitle :button-list="['btnClose']" @click-button="onButtonsClick" />
      </v-card-title>
      <v-card-text class="pa-0 content-area">
        <v-sheet class="d-flex flex-column fill-height">
          <v-sheet class="searchArea mb-0">
            <div class="d-flex justify-space-between align-center">
              <div style="font-size: 18px;">
                ■ 안전개선 조치현황
              </div>
              <div class="d-flex align-center">
                <div>
                  <i-select
                    margin="4px"
                    width="100px"
                    v-model="searchParams.YEAR"
                    :items="yearList"
                    item-value="COD"
                    item-title="TXT"
                    @update:model-value="searchData"
                  />
                </div>
                <div style="font-size: 18px;">
                  {{ `년 Risk 공모전 제보 건 수: ${dashData?.CNT_ALL} 건` }}
                </div>
              </div>
            </div>
          </v-sheet>
          <v-sheet class="pa-0 mt-2 h-auto">
            <div>
              <table class="dash-table">
                <colgroup>
                  <col style="width: 13%;">
                  <col style="width: 13%;">
                  <col style="width: 16%;">
                  <col style="width: 16%;">
                  <col style="width: 16%;">
                  <col style="width: 13%;">
                  <col style="width: 13%;">
                </colgroup>
                <tbody>
                  <tr class="table-title">
                    <td>대분류</td>
                    <td>미조치</td>
                    <td colspan="3">조치 예정</td>
                    <td>조치완료</td>
                    <td>합계</td>
                  </tr>
                  <tr class="table-title">
                    <td>소분류</td>
                    <td>개선 불요</td>
                    <td>
                      <div>개선 진행중</div>
                      <div>(즉 조치)</div>
                    </td>
                    <td>
                      <div>개선 추진</div>
                      <div>{{ `(단기 ${dashData?.CURR_YEAR}년 內)` }}</div>
                    </td>
                    <td>
                      <div>개선 추진</div>
                      <div>{{ `(중/장기 ${dashData?.NEXT_YEAR}년 ~)` }}</div>
                    </td>
                    <td>기 개선 완료</td>
                    <td>합계</td>
                  </tr>
                  <tr>
                    <td>제보 건 수</td>
                    <td>{{ dashData?.CNT_H }}</td>
                    <td>{{ dashData?.CNT_B }}</td>
                    <td>{{ dashData?.CNT_C }}</td>
                    <td>{{ dashData?.CNT_D }}</td>
                    <td>{{ dashData?.CNT_I }}</td>
                    <td>{{ dashData?.CNT_ALL }}</td>
                  </tr>
                  <tr>
                    <td>비율</td>
                    <td>{{ dashData?.PCNT_H }}</td>
                    <td>{{ dashData?.PCNT_B }}</td>
                    <td>{{ dashData?.PCNT_C }}</td>
                    <td>{{ dashData?.PCNT_D }}</td>
                    <td>{{ dashData?.PCNT_I }}</td>
                    <td>{{ dashData?.PCNT_ALL }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </v-sheet>
        </v-sheet>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style lang="scss" scoped>
.dash-table {
  width: 100%;
  border-collapse: collapse;

  td {
    text-align: center;
    padding: 4px;
    border: 1px solid #333333;
  }

  .table-title {
    td {
      background-color: #00ae41;
      color: #ffffff;
      font-weight: bold;
    }
  }

  tr:not(.table-title) {
    td {
      color: #0c2f86;
      font-weight: bold;
    }

    td:not(:first-child) {
      text-align: end;
    }
  }
}
</style>