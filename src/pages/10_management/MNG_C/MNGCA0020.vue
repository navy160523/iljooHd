<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from 'vue-i18n'
import IMenuTitle from '@/components/IMenuTitle.vue'
import IGridTitle from '@/components/IGridTitle.vue'
import ILabel from '@/components/ILabel.vue'
import RealGrid from '@/components/RealGrid.vue'

defineOptions({
  name:'MNGCA0020',
})

const t = useI18n().t //다국어
const menuTitle = ref(null)
const grdMain = ref(null)

const grdMainProps = reactive({
  gridViewOption : { },
  keys : ['YEAR','INSERT_DATE','INSERT_EMP_NM','CNFM_DATE'],
  fields : [ 
    { fieldName: 'COL1', dataType: 'text', width: '120', header: { text: t('COL1') }  },
    { fieldName: 'COL2', dataType: 'text', width: '120', header: { text: t('COL2') } },
    { fieldName: 'COL3', dataType: 'text', width: '120', header: { text: t('COL3') } },
    { fieldName: 'COL4', dataType: 'text', width: '120', header: { text: t('COL4') } },
    { fieldName: 'COL5', dataType: 'text', width: '120', header: { text: t('COL5') } },
    { fieldName: 'COL6', dataType: 'text', width: '120', header: { text: t('COL6') } },
  ],
  columns : [],
})

grdMainProps.columns = grdMainProps.fields

onMounted(() => {

})

const onButtonsClick = () => {

}
</script>

<template>
  <div>
    <VContainer
      class="pt-0"
    >
      <VRow>
        <VCol>
          <IMenuTitle
            ref="menuTitle"
            :title="$t(useLogsStore().menuId)"
            :button-list="['btnSearch', 'btnUpdate', 'btnReqApply', 'btnPrint', 'btnCopy']"
            @click-button="onButtonsClick"
          />
        </VCol>
      </VRow>
      <!-- 조회조건 -->
      <VRow no-gutters>
        <VCol>
          <VForm
            ref="searchArea"
            class="searchArea"
          >
            <VRow>  
              <VCol cols="12" md="2">
                <ILabel
                  :label="$t('년도')"
                  label-width="50"
                >
                  <template #editor="editorProps">
                    <VTextField
                      type="Number"
                    />
                  </template>      
                </ILabel>
              </VCol>
              <VCol cols="12" md="3">
                <ILabel
                  :label="$t('부서/ 협력사')"
                  label-width="100"
                >
                  <template #editor="editorProps">
                    <VTextField 
                      append-inner-icon="mdi-magnify" 
                    />
                  </template>      
                </ILabel>
              </VCol> 
            </VRow>
          </VForm>
        </VCol>
      </VRow>
      <VRow no-gutters>
        <VCol>
          <IGridTitle :title="$t('')">
            <template #editors />
          </IGridTitle>
          <RealGrid
            ref="grdMain"
            class="mt-2"
            style="height: 650px;"
            :grid-view-option="grdMainProps.gridViewOption"
            :keys="grdMainProps.keys" 
            :fields="grdMainProps.fields"
            :columns="grdMainProps.columns"
          />
        </VCol>
      </VRow>
    </VContainer>
  </div>
</template>
  
