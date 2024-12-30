///<reference path="typedefs.js"/>
import { processTemplateFile } from "./process-template-file.js";
import { getOutputFileExtension } from "./get-output-file-extension.js";
import { markdown, markdownPreprocessor } from "./preprocessors/markdown.js";
import { cssPreprocessor } from "./preprocessors/css.js";
import { htmlPreprocessor } from "./preprocessors/html.js";
import { smolYAML } from "./utils/smolyaml.js";
import { frontmatter } from "./utils/frontmatter.js";
import { template } from "./template.js";

export { markdown, markdownPreprocessor };
export { cssPreprocessor };
export { htmlPreprocessor };
export { smolYAML };
export { frontmatter };

export { processTemplateFile };
export { getOutputFileExtension };
export { template };
