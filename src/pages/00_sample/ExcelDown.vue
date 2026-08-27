<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from "vue"
import { useLogsStore } from "@hiway/stores/logs"
import { useI18n } from "vue-i18n"
import IMenuTitle from "@/components/IMenuTitle.vue"
import IGridTitle from "@/components/IGridTitle.vue"
import ILabel from "@/components/ILabel.vue"
import RealGrid from "@/components/RealGrid.vue"
import { commonExcelDownApi } from "@hiway/api/commonApi"

defineOptions({ name: "ExcelDown" })

const t = useI18n().t //다국어
const menuTitle = ref(null)
const grd1 = ref(null)
const checkedRow = reactive([]) //선택된 행들의 인덱스를 저장하고 있는 배열

const grdProps1 = reactive({
    gridViewOption: { checkBar: { visible: true } },
    keys: ["COL01"],
    fields: [
        {
            fieldName: "IMAGE",
            width: "60",
            renderer: {
                type: "image",
                imageCallback: function (grid, cell) {
                    var monetary = grid.getValue(cell.item.index, "IMAGE")

                    return monetary
                },
                imageHeight: 80,
            },
            header: { text: "IMAGE" },
        },
        {
            fieldName: "TEXT",
            datatype: "text",
            header: {
                text: "TEXT",
            },
        },
        {
            fieldName: "NUMBER",
            datatype: "NUMBER",
            header: {
                text: "NUMBER",
            },
        },
    ],
    columns: [],
})

const data = [
    { IMAGE: "src/assets/images/testimage/1.png", TEXT: "TEST1", NUMBER: 1234 },
    { IMAGE: "src/assets/images/testimage/2.png", TEXT: "TEST2", NUMBER: 1235 },
    { IMAGE: "src/assets/images/testimage/3.png", TEXT: "TEST3", NUMBER: 1236 },
    { IMAGE: "src/assets/images/testimage/4.png", TEXT: "TEST4", NUMBER: 1237 },
    { IMAGE: "src/assets/images/testimage/5.png", TEXT: "TEST5", NUMBER: 1238 },
]

const onButtonsClick = (btn) => {
    if ((btn.id = "btnExcel")) {
        //let row = getCheckedRowsData(checkedRow.value);
        //console.log("row", row);
        let param = {
            excel: "test",
        }
        commonExcelDownApi(param).then((res) => {
            const blob = new Blob([res], { type: res.type })
            const link = document.createElement("a")
            console.log("res:", res)
            const fileName = res.contentDisposition.split("=")[1]
            console.log(fileName)
            link.href = URL.createObjectURL(blob)
            link.download = fileName
            link.click()
            URL.revokeObjectURL(link.href)
        })
    }
}

const getCheckedRowsData = (idx) => {
    let rowData = []
    idx.forEach((e) => {
        let data = grd1.value.getDataProvider().getJsonRows(e, e)
        rowData.push(data[0])
    })

    return rowData
}

grdProps1.columns = grdProps1.fields

onMounted(() => {
    grd1.value.getDataProvider().setRows(data)
})

const checkItem = (grid, items, checked) => {
    checkedRow.value = grd1.value.getGridView().getCheckedItems()
}
</script>

<template>
    <VContainer>
        <VRow>
            <IMenuTitle
                ref="menuTitle"
                title="엑셀다운로드"
                :button-list="['btnExcel']"
                @click-button="onButtonsClick"
            />
        </VRow>
        <VRow>
            <VCol>
                <RealGrid
                    ref="grd1"
                    class="mt-2"
                    :grid-view-option="grdProps1.gridViewOption"
                    :keys="grdProps1.keys"
                    :fields="grdProps1.fields"
                    style="height: 500px"
                    :columns="grdProps1.columns"
                    @onItemChecked="checkItem"
                />
            </VCol>
        </VRow>
    </VContainer>
</template>
