<!-- SAFGA0010 안전 PASSPORT Tab2(장비자격)-->
<!-- SI2팀 김성근 2024-04-03  -->
<script setup>
import { ref, reactive, onMounted, getCurrentInstance, watch } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from 'vue-i18n'
import { commonSearchApi, commonExecuteApi, getCodeList, getCompanyList } from '@hiway/api/commonApi'
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'
import img1 from '@images/pages/pose-fs-9.png'
import { useUserStore } from '@hiway/stores/user'


const vm = getCurrentInstance().proxy //다이얼로그관련
const userStore = useUserStore() //유저정보
const t = useI18n().t //다국어
const emit = defineEmits(['set_gbn'])

// const codeList = reactive({
//   GBN: [
//     { name: "주민/인증번호", code: "A" },
//     { name: "사번", code: "B" },
//   ],
// })

// const searchParams = reactive({
//   SEARCH_GBN: 'A'
// })

const grdMain = ref(null)

const props = defineProps({
  IntData: {
    type: Array,
    required: false,
    default() {
      return [];
    },
  },
});
//그리드1 속성셋팅
const grdMainProps = reactive({
  gridViewOption : {edit: { editable: false }},
  keys : [''],
  fields : [ 
    { fieldName: 'LIC_KIND_NM', dataType: 'text', header: { text: t('자격종류') },styleName: "left-column"},
    { fieldName: 'LIC_GET_DT',header: { text: t('취득/인증일자') } ,
      editor: { datetimeFormat: "yyyy-MM-dd" },
      dataType: "datetime",
      datetimeFormat: "yyyy-MM-dd",
      editable: false},
    { fieldName: 'EDU_DT', dataType: 'text', header: { text: t('보수 교육일') } },
    { fieldName: 'STICKER_ID', dataType: 'text', header: { text: t('스티커발행번호') } },
    { fieldName: 'LIC_STATUS', dataType: 'text', header: { text: t('자격상태') } },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

//  이벤트 시작
onMounted(()=>{
  if(props.IntData[0]){
    grdMain.value.getDataProvider().setRows(props.IntData);
  }
  else{
    grdMain.value.getDataProvider().setRows(null);
  }
})

</script>

<template>
  <v-card class="pa-0 fill-height">
      
      <!-- <v-radio-group
        v-model="searchParams.SEARCH_GBN"
        class="radio-box mx-3"
        inline
        @change="emit('set_gbn', searchParams.SEARCH_GBN)"
      >
      <v-radio
        v-for="(item, i) in codeList.GBN"
        :key="i"
        :value="item.code"
        :label="item.name"
      />
      </v-radio-group> -->
    
      <div class="content-area">
        <v-sheet height="80%" class="mb-3">
          <RealGrid
            ref="grdMain"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
          />
        </v-sheet>
      </div>
  </v-card>
</template>
<style lang="scss" scoped>
.content-area {
  position: relative;
  height: 26vh;
}

</style>
