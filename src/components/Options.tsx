import type { MetricType } from "../metrics/metrics"
import { Metric } from "../metrics/metrics"
import { EnumSelect } from "./EnumSelect"
import type { ChartType } from "../contexts/OptionsContext"
import { Chart, useOptions } from "../contexts/OptionsContext"
import { Icon } from "@mdi/react"
import { memo, useMemo, useState, useEffect, useRef } from "react"
import { FileSelector } from "src/components/FileSelector"
import { useData } from "~/contexts/DataContext"

import {
  mdiChartBubble,
  mdiChartTree,
  mdiAccountNetwork,
  mdiPodiumGold,
  mdiFileCodeOutline,
  mdiUpdate,
  mdiResize,
  mdiSourceCommit,
  mdiScaleBalance,
  mdiPalette,
  mdiImageSizeSelectSmall,
  mdiPuzzle,
  mdiPlusMinusVariant,
  mdiFolder,
  mdiGroup,
  mdiTextBox
} from "@mdi/js"
import type { SizeMetricType } from "~/metrics/sizeMetric"
import { SizeMetric } from "~/metrics/sizeMetric"
import type { GroupingType } from "~/metrics/grouping"
import { Grouping } from "~/metrics/grouping"

export const relatedSizeMetric: Record<MetricType, SizeMetricType> = {
  FILE_TYPE: "FILE_SIZE",
  TOP_CONTRIBUTOR: "MOST_CONTRIBS",
  MOST_COMMITS: "MOST_COMMITS",
  LAST_CHANGED: "LAST_CHANGED",
  MOST_CONTRIBUTIONS: "MOST_CONTRIBS"
}

export const Options = memo(function Options() {
  const {
    metricType,
    chartType,
    sizeMetric,
    linkMetricAndSizeMetric,
    groupingType,
    setMetricType,
    setChartType,
    setSizeMetricType,
    setGroupingType,
    setSelectedFilePaths,
    setSelectedAuthors,
    setSelectedFiles
  } = useOptions()

  const { databaseInfo } = useData()
  const [showAuthorFilter, setShowAuthorFilter] = useState(false)
  const [showFileFilter, setShowFileFilter] = useState(false)
  const [searchFilter, setSearchFilter] = useState("")
  const [fileSearchFilter, setFileSearchFilter] = useState("")
  const [fileExtensionFilter, setFileExtensionFilter] = useState("")
  const [minCommits, setMinCommits] = useState<number | undefined>(undefined)
  const [maxCommits, setMaxCommits] = useState<number | undefined>(undefined)
  const [minLineChanges, setMinLineChanges] = useState<number | undefined>(undefined)
  const [maxLineChanges, setMaxLineChanges] = useState<number | undefined>(undefined)
  const authorInitializedRef = useRef(false)
  const filesInitializedRef = useRef(false)

  // Get all authors and files from database
  const allAuthors = Object.keys(databaseInfo?.authorsTotalStats || {})
  const allFiles = useMemo(() => {
    const files = new Set<string>()
    Object.values(databaseInfo?.authorsFilesStats || {}).forEach((authorFiles) => {
      Object.keys(authorFiles).forEach((file) => files.add(file))
    })
    return Array.from(files)
  }, [databaseInfo?.authorsFilesStats])

  // Initialize selected authors and files
  useEffect(() => {
    if ((!selectedAuthors || selectedAuthors.length === 0) && !authorInitializedRef.current && allAuthors.length > 0) {
      setSelectedAuthors(allAuthors)
      authorInitializedRef.current = true
    }
  }, [allAuthors, selectedAuthors, setSelectedAuthors])

  useEffect(() => {
    if (
      (!selectedFiles || selectedFiles.length === 0) &&
      !filesInitializedRef.current &&
      allFiles.length > 0
    ) {
      console.log(`Initializing files selection with ${allFiles.length} files`)
      setSelectedFiles(allFiles)
      filesInitializedRef.current = true
    }
  }, [allFiles, selectedFiles, setSelectedFiles])

  // Filtered authors based on search term
  const filteredAuthors = allAuthors
    .filter((author) => author.toLowerCase().includes(searchFilter.toLowerCase()))
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))

  const authorFilteredStats = useMemo(() => {
    if (!databaseInfo?.authorsFilesStats) return {}

    const stats: Record<string, { nb_commits: number; nb_line_change: number }> = {}
    allAuthors.forEach((author) => {
      stats[author] = { nb_commits: 0, nb_line_change: 0 }
    })

    // Calculate stats based only on selected files
    Object.entries(databaseInfo.authorsFilesStats).forEach(([author, fileStats]) => {
      Object.entries(fileStats).forEach(([filePath, fileContributions]) => {
        if (selectedFiles.includes(filePath)) {
          stats[author].nb_commits += fileContributions.nb_commits
          stats[author].nb_line_change += fileContributions.nb_line_change
        }
      })
    })

    return stats
  }, [databaseInfo?.authorsFilesStats, selectedFiles, allAuthors])

  // Filter authors based on numeric stats
  const numericFilteredAuthors = useMemo(() => {
    return filteredAuthors.filter((author) => {
      const stats = authorFilteredStats[author]
      if (!stats) return false

      if (minCommits !== undefined && stats.nb_commits < minCommits) return false
      if (maxCommits !== undefined && stats.nb_commits > maxCommits) return false
      if (minLineChanges !== undefined && stats.nb_line_change < minLineChanges) return false
      if (maxLineChanges !== undefined && stats.nb_line_change > maxLineChanges) return false

      return true
    })
  }, [filteredAuthors, minCommits, maxCommits, minLineChanges, maxLineChanges, authorFilteredStats])

  // File filtering based on search term and extension
  const filteredFiles = useMemo(() => {
    return allFiles
      .filter((file) => {
        // Filter by search term
        if (!file.toLowerCase().includes(fileSearchFilter.toLowerCase())) return false

        // Filter by file extension if specified
        if (fileExtensionFilter) {
          const ext = file.split(".").pop() || ""
          if (!ext.toLowerCase().includes(fileExtensionFilter.toLowerCase())) return false
        }

        return true
      })
      .sort((a, b) => a.localeCompare(b))
  }, [allFiles, fileSearchFilter, fileExtensionFilter])

  const visualizationIcons: Record<MetricType, string> = {
    FILE_TYPE: mdiFileCodeOutline,
    LAST_CHANGED: mdiUpdate,
    MOST_COMMITS: mdiSourceCommit,
    TOP_CONTRIBUTOR: mdiPodiumGold,
    MOST_CONTRIBUTIONS: mdiPlusMinusVariant
  }

  const sizeMetricOptions = useMemo(() => {
    if (groupingType === "FILE_AUTHORS") {
      // Only return the relevant options for FILE_AUTHORS
      return {
        MOST_COMMITS: "Commits",
        MOST_CONTRIBS: "Line Changes", 
        EQUAL_SIZE: "Equal"
      } as Record<SizeMetricType, string>
    }
    return SizeMetric // Use all options for other groupings
  }, [groupingType])

  const sizeMetricIcons = useMemo(() => {
    const allIcons: Record<SizeMetricType, string> = {
      FILE_SIZE: mdiResize,
      EQUAL_SIZE: mdiScaleBalance,
      MOST_COMMITS: mdiSourceCommit,
      LAST_CHANGED: mdiUpdate,
      MOST_CONTRIBS: mdiPlusMinusVariant
    }
    
    if (groupingType === "FILE_AUTHORS") {
      // Only return icons for the visible options
      return {
        MOST_COMMITS: allIcons.MOST_COMMITS,
        MOST_CONTRIBS: allIcons.MOST_CONTRIBS,
        EQUAL_SIZE: allIcons.EQUAL_SIZE
      } as Record<SizeMetricType, string>
    }
    
    return allIcons
  }, [groupingType])

  const groupingTypeOptions = useMemo(() => {
    if (chartType === "AUTHOR_GRAPH") {
      // For Author Graph, exclude FILE_AUTHORS since it doesn't make sense
      const { FILE_AUTHORS, ...filteredGrouping } = Grouping
      return filteredGrouping as Record<Exclude<GroupingType, "FILE_AUTHORS">, string>
    }
    
    return Grouping
  }, [chartType])

  const groupingTypeIcons = useMemo(() => {
    const allIcons: Record<GroupingType, string> = {
      FILE_TYPE: mdiFileCodeOutline,
      FOLDER_NAME: mdiFolder,
      JSON_RULES: mdiTextBox,
      FILE_AUTHORS: mdiAccountNetwork,
      AUTHOR_FILES: mdiAccountMultiple
    }
    
    if (chartType === "AUTHOR_GRAPH") {
      // For Author Graph, exclude FILE_AUTHORS icon
      const { FILE_AUTHORS, ...filteredIcons } = allIcons
      return filteredIcons
    }
    
    return allIcons
  }, [chartType])

  // Update the groupingTypeIcons to handle the filtering:
  const chartTypeIcons: Record<ChartType, string> = {
    BUBBLE_CHART: mdiChartBubble,
    TREE_MAP: mdiChartTree,
    AUTHOR_GRAPH: mdiAccountNetwork
  }

  // Buttons Behaviors
  const toggleAuthor = (author: string) => {
    if (selectedAuthors.includes(author)) {
      setSelectedAuthors(selectedAuthors.filter((a) => a !== author))
    } else {
      setSelectedAuthors([...selectedAuthors, author])
    }
  }

  const toggleFile = (file: string) => {
    if (selectedFiles.includes(file)) {
      setSelectedFiles(selectedFiles.filter((f) => f !== file))
    } else {
      setSelectedFiles([...selectedFiles, file])
    }
  }

  const selectVisibleAuthors = () => {
    const newSelection = [...new Set([...selectedAuthors, ...numericFilteredAuthors])]
    setSelectedAuthors(newSelection)
  }

  const deselectVisibleAuthors = () => {
    setSelectedAuthors(selectedAuthors.filter((author) => !numericFilteredAuthors.includes(author)))
  }

  const deselectEmpty = () => {
    setSelectedAuthors(
      selectedAuthors.filter((author) => {
        const stats = authorFilteredStats[author]
        return !(stats && stats.nb_commits === 0 && stats.nb_line_change === 0)
      })
    )
  }

  const selectAllVisibleFiles = () => {
    const newSelection = [...new Set([...selectedFiles, ...filteredFiles])]
    setSelectedFiles(newSelection)
  }

  const deselectAllVisibleFiles = () => {
    setSelectedFiles(selectedFiles.filter((file) => !filteredFiles.includes(file)))
  }

  const resetFileFilters = () => {
    setFileSearchFilter("")
    setFileExtensionFilter("")
  }

  const resetAuthorFilters = () => {
    setMinCommits(undefined)
    setMaxCommits(undefined)
    setMinLineChanges(undefined)
    setMaxLineChanges(undefined)
    setSearchFilter("")
  }

  const resetAllFilters = () => {
    resetFileFilters()
    resetAuthorFilters()
    setSelectedFiles(allFiles)
    setSelectedAuthors(allAuthors)
  }

  // Auto-switch grouping when chart type changes
  useEffect(() => {
    if (chartType === "AUTHOR_GRAPH" && groupingType === "FILE_AUTHORS") {
      setGroupingType("FOLDER_NAME")
    }
  }, [chartType, groupingType, setGroupingType])

  return (
    <>
      <div className="card">
        <fieldset className="rounded-lg border p-2">
          <legend className="card__title ml-1.5 justify-start gap-2">
            <Icon path={mdiPuzzle} size="1.25em" />
            Layout
          </legend>
          <EnumSelect
            enum={Chart}
            defaultValue={chartType}
            onChange={(chartType: ChartType) => setChartType(chartType)}
            iconMap={chartTypeIcons}
          />
        </fieldset>
        
        <fieldset className="rounded-lg border p-2">
          <legend className="card__title ml-1.5 justify-start gap-2">
            <Icon path={mdiImageSizeSelectSmall} size="1.25em" />
            Size
          </legend>
          <EnumSelect
            enum={sizeMetricOptions}
            defaultValue={sizeMetric}
            onChange={(sizeMetric: SizeMetricType) => setSizeMetricType(sizeMetric)}
            iconMap={sizeMetricIcons}
          />
        </fieldset>
        
        {/* Only show Color options for non-FILE_AUTHORS groupings */}
        {groupingType !== "FILE_AUTHORS" && (
          <fieldset className="rounded-lg border p-2">
            <legend className="card__title ml-1.5 justify-start gap-2">
              <Icon path={mdiPalette} size="1.25em" />
              Color
            </legend>
            <EnumSelect
              enum={Metric}
              defaultValue={metricType}
              onChange={(metric: MetricType) => {
                setMetricType(metric)
                if (!linkMetricAndSizeMetric) {
                  return
                }
                const relatedSizeMetricType = relatedSizeMetric[metric]
                if (relatedSizeMetricType) {
                  setSizeMetricType(relatedSizeMetricType)
                }
              }}
              iconMap={visualizationIcons}
            />
          </fieldset>
        )}
        
        <fieldset className="rounded-lg border p-2">
          <legend className="card__title ml-1.5 justify-start gap-2">
            <Icon path={mdiGroup} size="1.25em" />
            Grouping
          </legend>
          <EnumSelect
            enum={groupingTypeOptions as Record<GroupingType, string>}
            defaultValue={groupingType}
            onChange={(groupingType: GroupingType) => {
              setGroupingType(groupingType)
              
              // Auto-switch to relevant size metric for FILE_AUTHORS
              if (groupingType === "FILE_AUTHORS") {
                if (sizeMetric === "FILE_SIZE" || sizeMetric === "LAST_CHANGED") {
                  setSizeMetricType("MOST_CONTRIBS") // Default to line changes
                }
              }
            }}
            iconMap={groupingTypeIcons as Record<GroupingType, string>}
          />
        </fieldset>
      </div>

      {/* Add the conditional FileSelector here */}
      {groupingType === "FILE_AUTHORS" && (
        <div className="card mt-4">
          <FileSelector />
        </div>
      )}
    </>
  )
})
