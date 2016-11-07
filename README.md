# doxygen2md

> A doxygen to markdown converter.

An example of the result can be seen [here](https://pshampanier.gitbooks.io/libpqmxx/content/)
in the API section.

## Usage

1. Run `doxygen` to generate the XML documentation.
2. Run `doxygen2md` providing the folder location of the XML documentation.  

  ```
  Usage: doxygen2md [options] <doxygen directory>

  Options:

    -h, --help           output usage information
    -V, --version        output the version number
    -v, --verbose        verbose mode
    -a, --anchors        add anchors for internal links
    -g, --groups         output doxygen groups separately
    -o, --output <file>  output file
  ```

The all documentation converted to Markdown is generated to the output file.
