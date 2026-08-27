<script setup>
import { ref, reactive, onMounted, getCurrentInstance, nextTick } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useUserStore } from '@hiway/stores/user'
import { useI18n } from 'vue-i18n'
import IGridTitle from '@/components/IGridTitle.vue'
import { commonSearchApi, } from '@hiway/api/commonApi'
import queryFlowHelper from '@/utils/searchFlowHelper'
import dayjs from 'dayjs'
import Message from '@hiway/utils/notify'
import _ from 'lodash'

const emit = defineEmits(['close'])

defineOptions({
})

const vm = getCurrentInstance().proxy
const userStore = useUserStore()
const t = useI18n().t
const gridTitle = ref(null)
const popupTitle = ref('')
const testItem = ref([])
const answItem = ref([])
const answCnt = ref(0)
const totalCnt = ref(0)
const testTime = ref(0)
const testPoint = ref('')
const testStart = ref('')
const testEnd = ref('')

const dialog = ref(false)

const onButtonsClick = btn => {
  if(btn.id === 'btnClose'){
    onClose()
  }
}

const onClose = () => {
  dialog.value = false
}

const clearPopup = () => {
  testItem.value = []
  answItem.value = []
  answCnt.value = 0
  totalCnt.value = 0
  testTime.value = 0
  testPoint.value = ''
  testStart.value = ''
  testEnd.value = ''
}

const openPopup = data => {
  clearPopup()

  commonSearchApi({ queryId : 'EDUCB0020_SEARCH_02', param: data }).then(res => {
    const mainData = res.ORESULT_CUR1[0]
    const detailData = res.ORESULT_CUR2
    
    popupTitle.value = `안전역량 평가결과 조회(${mainData.CHK_JIC_NM} - ${mainData.CHK_EQUIP_NM})`
    
    testItem.value = _.uniqBy(
      detailData.map(row => {
        return { TEST_ITEM: row.TEST_ITEM, TEST_DESC: row.TEST_DESC, POINT_OX: row.POINT_OX }
      }),
      'TEST_ITEM'
    )

    testItem.value.forEach(rowTest => {
      answItem.value.push(_.filter(detailData, rowAnsw => { return rowAnsw.TEST_ITEM === rowTest.TEST_ITEM }))
    })

    testPoint.value = data.TEST_POINT
    testStart.value = data.TEST_START_DATE
    testEnd.value = data.TEST_END_DATE
    answCnt.value =  _.filter(testItem.value.flat(), row => row.POINT_OX === 'O').length
    totalCnt.value = mainData.TEST_CNT
    testTime.value = mainData.TEST_TIME

    dialog.value = true
  })
}

onMounted(() => {
  nextTick(() => {
    
  })
})

defineExpose({
  openPopup,
})
</script>


<template>
  <VDialog
    v-model="dialog"
    eager
    persistent
    scrollable
    width="850"
    max-height="100vh"
    class="p-absolute user-select-none"
  >
    <v-sheet
      color="primarySub"
      height="50"
      class="px-4 d-flex align-center rounded-t-5"
    >
      <span>시험결과 조회 팝업</span>
    </v-sheet>
    <div class="fill-height d-flex flex-column popup-main pa-3 rounded-b-5">
      <IGridTitle
        ref="gridTitle"
        :title="popupTitle"
        :button-list="['btnClose']"
        @click-button="onButtonsClick"
      />
      <div class="popup-progress d-flex justify-space-between align-end px-2 pb-1">
        <div class="d-flex flex-column justify-center">
          <div class="d-flex">
            <div class="pr-2">
              시작 일시 :
            </div>
            <div>
              {{ testStart }}
            </div>
          </div>
          <div class="d-flex">
            <div class="pr-2">
              종료 일시 :
            </div>
            <div>
              {{ testEnd }}
            </div>
          </div>
          <div class="d-flex">
            <div class="pr-2">
              경과 시간 :
            </div>
            <div>
              {{ `${testTime}분` }}
            </div>
          </div>
        </div>
        <div class="d-flex align-center">
          <div class="title pr-2">
            점수 :
          </div>
          <div class="slash">
            {{ testPoint }}
          </div>
          <div class="slash px-1">
            (
          </div>
          <div class="answ-cnt" :style="{ color: answCnt < totalCnt ? '#ff5353': '#0681fd' }">
            {{ answCnt }}
          </div>
          <div class="slash px-1">
            /
          </div>
          <div class="total-cnt">
            {{ totalCnt }}
          </div>
          <div class="slash px-1">
            )
          </div>
        </div>
      </div>
      <div class="popup-body overflow-y-auto pa-5">
        <div
          v-for="(rowTest, idxTest) in testItem"
          :key="rowTest.TEST_ITEM"
          class="test-item__card px-4 py-3"
          :class="[idxTest > 0 ? 'mt-4' : '']"
        >
          <div class="test-item font-weight-bold">
            <div class="div-ox" :class="[`div-ox__${rowTest.POINT_OX}`]">
              <div class="div-x">
                <div class="div-x__left" />
                <div class="div-x__right" />
              </div>
            </div>
            {{ `${idxTest + 1}. ${rowTest.TEST_DESC}` }}
          </div>
          <div class="answ-item__body px-2">
            <v-radio-group
              v-for="rowAnsw in answItem[idxTest]"
              :key="`${rowAnsw.TEST_ITEM}-${rowAnsw.ANSW_ITEM}`"
              v-model="rowAnsw.CHK_YN"
              class="mt-2 answ-item"
            >
              <div v-if="rowAnsw.PASS_YN === 'Y'" class="div-pass" />
              <v-radio
                :label="rowAnsw.ANSW_DESC"
                true-value="Y"
                false-value="N"
                readonly
              />
            </v-radio-group>
          </div>
        </div>
      </div>
    </div>
  </VDialog>
</template>
    

<style scoped lang="scss">
.popup-main {
  background-color: #ffffff;
  
  .popup-progress {
    height: 80px;

    .title {
      font-size: 20px;
    }

    .answ-cnt {
      font-size: 28px;
    }

    .slash {
      font-size: 28px;
    }

    .total-cnt {
      font-size: 28px;
      color: #0681fd;
    }
  }

  .popup-body {
    height: calc(100vh - 50px - 52px - 80px - 24px);
    background-color: #f0f0f0;
    border-radius: 5px;

    .test-item__card {
      background-color: #ffffff;
      border-radius: 5px;

      .test-item {
        position: relative;

        .div-ox {
          position: absolute;
          top: -20px;
          left: -24px;
          width: 60px;
          height: 60px;
          z-index: 10;
        }

        .div-ox__O {
          border: 5px solid rgba(6, 129, 253, 0.7);
          border-radius: 50%;
        }

        .div-ox__X {
          .div-x {
            position: relative;
            width: 100%;
            height: 100%;

            .div-x__left {
              position: absolute;
              top: -12px;
              left: 12px;
              width: 50%;
              height: 125%;
              border-right: 5px solid rgba(255, 83, 83, 0.7);
              rotate: 45deg;
            }

            .div-x__right {
              // position: absolute;
              // top: -16px;
              // right: 8px;
              // width: 50%;
              // height: 125%;
              // border-left: 5px solid #ff5353;
              // rotate: -45deg;
            }
          }
        }
      }

      .answ-item {
        position: relative;

        .div-pass {
          position: absolute;
          top: 0;
          left: -5px;
          width: 28px;
          height: 28px;
          border: 4px solid #ff5353;
          border-radius: 50%;
        }
      }
    }
  }
}
</style>