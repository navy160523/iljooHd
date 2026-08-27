<script setup>
import { ref, onMounted, getCurrentInstance, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import _ from 'lodash'
import AppDateTimePicker from '@core/components/AppDateTimePicker.vue'
import OZReport from '@/components/OZReport.vue'
import {
  commonSendApi,
} from '@hiway/api/commonApi'

const vm = getCurrentInstance().proxy
const t = useI18n().t
const rangeValues = ref([])
const rangeColors = ref([])
const itemMargin = ref(2)
const itemWidth = ref(75)
const itemPct = ref([])
const itemHeight = ref(12)
const textWidth = ref(30)
const aVal = ref(null)
const bVal = ref(null)
const dateRange = ref('')
const currEnv = process.env.NODE_ENV
const insertString = ref('')
const showOz = ref(false)
const ozReportName = ref('/manage/hse/RSKCA0010_test.ozr')
const ozParams = ref([
  "IN_COMPANY_CD=HHI",
  "IN_DEPT_CD=XBS0",
  "PARTNER_CD",
  "IN_HALF=1",
  "IN_NROUTINE_WORK_ID=HHIS-CN-XBS0-001",
  "IN_YEAR=2025"
])
const highLightTest = ref([
  { VAL: '' },
  { VAL: '' },
  { VAL: '' },
])

const dateTest = ref('2024-09-04')

const setRangeValues = () => {
  rangeValues.value = [
    55,
    60,
    65,
    70,
    75,
    80,
    85,
    90,
    95,
    100
  ]
}

const setColors = () => {
  rangeColors.value = [
    '#FF5353',
    '#FF7638',
    '#FF983C',
    '#FEBE30',
    '#94C81C',
    '#0CB69C',
    '#17C3F4',
    '#0681FD',
    '#1B41C7',
  ]
}

const setDivColor = (minTemp, maxTemp) => {
  // console.log('minTemp',minTemp)
  // console.log('maxTemp', maxTemp)

  itemPct.value = []

  if(minTemp === null || maxTemp === null) {
    for(let i = 0; i < rangeValues.value.length - 1; i++) {
      itemPct.value.push(
        `linear-gradient(`
        + `  to right,`
        + `  transparent 0 100%`
        + `)`
      )
    }
  } else {
    const min = minTemp < rangeValues.value[0] ? rangeValues.value[0] : minTemp
    const max = maxTemp > rangeValues.value[rangeValues.value.length - 1] ? rangeValues.value[rangeValues.value.length - 1] : maxTemp

    if(min === max) {
      for(let i = 0; i < rangeValues.value.length - 1; i++) {
        if(rangeValues.value[i] <= min && rangeValues.value[i + 1] > max) {
          const divVal = rangeValues.value[i + 1] - rangeValues.value[i]

          itemPct.value.push(
            `linear-gradient(`
            + `  to right,`
            + `  transparent 0 ${(min - rangeValues.value[i]) * 100 / divVal}%,`
            + `  ${rangeColors.value[i]} ${(min - rangeValues.value[i]) * 100 / divVal}% ${(min - rangeValues.value[i]) * 100 / divVal + 3}%,`
            + `  transparent ${(min - rangeValues.value[i]) * 100 / divVal + 3}%`
            + `)`
          )
        } else {
          itemPct.value.push('')
        }
      }
    } else if(max > min) {
      for(let i = 0; i < rangeValues.value.length - 1; i++) {
        const divVal = rangeValues.value[i + 1] - rangeValues.value[i]

        if(rangeValues.value[i] <= min && rangeValues.value[i + 1] > min) {
          const endPercent = (max - rangeValues.value[i]) * 100 / divVal > 100 ? 100 : (max - rangeValues.value[i]) * 100 / divVal

          itemPct.value.push(
            `linear-gradient(`
            + `  to right,`
            + `  transparent 0 ${(min - rangeValues.value[i]) * 100 / divVal}%,`
            + `  ${rangeColors.value[i]} ${(min - rangeValues.value[i]) * 100 / divVal}% ${endPercent}%,`
            + `  transparent ${endPercent}%`
            + `)`
          )
        } else if(rangeValues.value[i] < min) {
          itemPct.value.push('')
        } else if(rangeValues.value[i] > min && rangeValues.value[i + 1] < max || rangeValues.value[i + 1] === max) {
          itemPct.value.push(
            `linear-gradient(`
            + `  to right,`
            + `  ${rangeColors.value[i]} 0 100%`
            + `)`
          )
        } else if(rangeValues.value[i] < max && rangeValues.value[i + 1] > max) {
          const endPercent = (max - rangeValues.value[i]) * 100 / divVal > 100 ? 100 : (max - rangeValues.value[i]) * 100 / divVal

          itemPct.value.push(
            `linear-gradient(`
            + `  to right,`
            + `  ${rangeColors.value[i]} 0 ${endPercent}%,`
            + `  transparent ${endPercent}%`
            + `)`
          )
        } else {
          itemPct.value.push('')
        }
      }
    } else {
      for(let i = 0; i < rangeValues.value.length - 1; i++) {
        itemPct.value.push('')
      }
    }
  }

  // console.log('itemPct.value', itemPct.value)
}

const showRange = () => {
  window.alert(dateRange.value)
}

const clickGo = () => {
  const ele = document.getElementsByClassName('show-color')
  const ele2 = document.getElementsByClassName('box-highlight')

  for(let i = 0; i < ele.length; i++) {
    ele[i].classList.remove('show-color')
  }

  for(let i = 0; i < ele2.length; i++) {
    ele2[i].classList.add('show-color')
  }
}

const clickOz = () => {
  showOz.value = true
}

const clickMail = () => {
  commonSendApi({
    SUBJECT: 'test',
    CONTENT: 'test',
    EMAIL: [
      'BP22613@bp.hd.com'
    ]
  })
}

const clickInsertQuery = () => {
  const data = insertString.value.replace(/\r/g, '').replace(/\t/g, "', '")
  const dataArr = data.split('\n')
  let result = ''

  for(let i = 0; i < dataArr.length; i++) {
    const row = dataArr[i]

    if(dataArr.length === 1) {
      result += `SELECT '${row}' FROM DUAL`
    } else {
      if(i === 0) {
        result += `SELECT '${row}' FROM DUAL UNION ALL`
      } else if(i === dataArr.length - 1) {
        result += `\nSELECT '${row}' FROM DUAL`
      } else {
        result += `\nSELECT '${row}' FROM DUAL UNION ALL`
      }
    }
  }

  result = `INSERT INTO ? (\n\n)\n${result};`
  result = result.replace(/\'SYSDATE\'/gi, 'SYSDATE').replace(/\'\'/gi, 'NULL')

  insertString.value = result
}

onMounted(() => {
  setColors()
  setRangeValues()
  setDivColor(aVal.value, bVal.value)
})
</script>

<template>
  <div>
    <div class="d-flex align-center" style="width: 450px;">
      <AppDateTimePicker
        v-model="dateRange"
        label="Range"
        :config="{ mode: 'range' }"
      />
      <v-btn @click.stop="showRange">show range</v-btn>
    </div>
    <div class="d-flex align-center mt-3" style="width: 300px;">
      <i-number v-model="aVal" />
      &nbsp;~&nbsp;
      <i-number v-model="bVal" />
      <v-btn @click.stop="setDivColor(aVal, bVal)">run</v-btn>
    </div>
    <div class="d-flex range-wrapper pt-6 px-3 mt-3">
      <div
        class="range-values text-center"
        v-for="(value, idx) in rangeValues" :key="`value-${idx}`"
        :style="{ width: `${textWidth}px`, left: `${idx * 75 + idx * itemMargin - textWidth / 2 + 12}px` }"
      >
        {{ value }}
      </div>
      <div
        class="range-colors"
        v-for="(color, idx) in rangeColors" :key="`color-${idx}`"
        :style="{
          width: `${itemWidth}px`,
          height: `${itemHeight}px`,
          'background-color': color,
          'margin-left': `${idx === 0 ? 0 : itemMargin}px`
        }"
      />
    </div>
    <div class="d-flex mt-3 px-3">
      <div
        class="range-colors"
        v-for="(item, idx) in itemPct" :key="`color-${idx}`"
        :style="{
          width: `${itemWidth}px`,
          height: `${itemHeight}px`,
          'background-color': '#dddddd',
          'background-image': item,
          'margin-left': `${idx === 0 ? 0 : itemMargin}px`
        }"
      />
    </div>
    <div class="mt-3 px-3">
      <table>
        <tbody>
          <tr>
            <th width="125">엉엉엉엉엉엉엉엉엉엉엉엉엉엉엉엉엉엉엉엉엉엉엉엉엉엉엉엉엉엉엉엉엉엉엉엉엉엉</th>
            <th width="275">클클클클클클클클클클클클클클클클클클클클클클클클클클클클클클클클클클클클클클클클클클클클클클클클</th>
          </tr>
          <tr>
            <td>우우우우우우우우우우우우우우우우우우우우우우우우우우우우우우우우우우우우우우우우우우우우우우우우우우우</td>
            <td>빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈빈</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="mt-3 px-3">
      {{ `env: ${currEnv}` }}
    </div>
    <div class="mt-2" style="width: 250px;">
      <v-btn @click.stop="clickGo">
        GO
      </v-btn>
      <div
        v-for="(item, idx) in highLightTest"
        :key="`highLightTest-${idx}`"
        class="py-1"
      >
        <v-text-field
          :class="'box-highlight' + item.VAL"
          v-model="item.VAL"
        />
      </div>
    </div>
    <div>
      <v-btn @click.stop="clickOz">
        OZREPORT
      </v-btn>
    </div>
    <div>
      <v-btn @click.stop="clickMail">
        MAILTEST
      </v-btn>
    </div>
    <div class="mt-2">
      <v-textarea
        v-model="insertString"
      />
      <v-btn @click.stop="clickInsertQuery">
        INSERT QUERY
      </v-btn>
    </div>
    <OZReport
      :showPop="showOz"
      :reportName="ozReportName"
      :params="ozParams"
      @close="showOz = $event"
    />
    <!-- <i-input
      :label="$t('날짜')"
      labelWidth="60px"
      width="230px"
      v-model="dateTest"
      use-date-copy
      type="date"
    /> -->
  </div>
</template>

<style lang="scss" scoped>
.range-wrapper {
  position: relative;
  width: fit-content;
}

.range-values {
  position: absolute;
  top: 0;
  color: #000000;
}

table {
  th, td {
    border: 1px solid black;
  }
}

.box-highlight.show-color {
  border: 1px solid red;
}
</style>
