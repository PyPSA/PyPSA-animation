
################################
PyPSA-animation
################################

.. contents::

.. section-numbering::


About
=====

PyPSA-animation is a tool to convert results from `Python for Power
System Analysis <https://github.com/PyPSA/PyPSA>`_ to interactive web
animations.

PyPSA-animation is built primarily using `D3.js <https://d3js.org/>`_.

It is released as `free software
<http://www.gnu.org/philosophy/free-sw.en.html>`_ under the `AGPL
<https://www.gnu.org/licenses/agpl-3.0.en.html>`_.

Example
=======

See `PyPSA-Eur-30 <https://www.pypsa.org/animations/pypsa-eur-30/>`_.

How to use it
=============

First you have to convert your PyPSA network scenarios into folders of
JSON data files. For this, use the script ``export_network.py``.

Then adjust the parameters in ``network.js`` appropriately.


Licence
=======

Copyright 2018 Tom Brown (FIAS)

This program is free software: you can redistribute it and/or
modify it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation; either `version 3 of the
License <LICENSE.txt>`_, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
`GNU Affero General Public License <LICENSE.txt>`_ for more details.
